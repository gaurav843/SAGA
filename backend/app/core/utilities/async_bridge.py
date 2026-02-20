# FILEPATH: backend/app/core/utilities/async_bridge.py
# @file: Async Logic Bridge (Context Aware)
# @author: The Engineer (ansav8@gmail.com)
# @description: Allows Synchronous code (SQLAlchemy hooks) to execute Asynchronous logic
# while preserving the Request Context (User Identity).
# @security-level: LEVEL 10 (Context Preservation)
# @invariant: Must propagate ContextVars to the Sidecar Thread.

import asyncio
import threading
import logging
import contextvars
from typing import Any, Coroutine, TypeVar

logger = logging.getLogger("core.utilities.bridge")

T = TypeVar("T")

class AsyncBridge:
    """
    The Connector between the Blocking DB Layer and the Non-Blocking Logic Layer.
    Implements the 'Sidecar Thread' pattern with Context Propagation.
    """

    @staticmethod
    def run_sync(coro: Coroutine[Any, Any, T]) -> T:
        """
        Executes a coroutine synchronously by spawning a fresh Event Loop in a separate thread.
        Crucially, it CARRIES the ContextVars (User Identity) across the thread boundary.
        """
        result: list[T] = []
        error: list[Exception] = []
        
        # ⚡ 1. CAPTURE CONTEXT
        # Snapshot the current state (User, Request ID, etc.)
        # This allows the background thread to "know" who initiated the save.
        ctx = contextvars.copy_context()

        def target():
            try:
                # ⚡ 2. SETUP SIDECAR LOOP
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                # ⚡ 3. EXECUTE WITHIN CONTEXT
                # We wrap the execution in ctx.run() so the coroutine sees the vars.
                # Note: We must wrap the loop.run_until_complete call itself,
                # or create a wrapper task that runs in context.
                
                # Best practice: ctx.run(task)
                async def context_wrapper():
                    return await coro

                # The loop itself doesn't need the context, the coroutine does.
                # However, ctx.run() takes a callable.
                # We simply run the loop logic.
                res = loop.run_until_complete(
                    # This ensures the async task inherits the context
                    # But simpler: we just run the whole block in context if possible.
                    # Actually, contextvars context applies to the *thread* execution stack.
                    # So executing ctx.run(func) sets the context for 'func'.
                    context_wrapper()
                )
                
                result.append(res)
                loop.close()
                
            except Exception as e:
                logger.error(f"🔥 [Bridge] Sidecar Crash: {e}", exc_info=True)
                error.append(e)

        # ⚡ 4. SPAWN THREAD WITH CONTEXT
        # We pass 'target' to ctx.run, so 'target' runs with the variables set.
        # But we are starting a NEW thread. ctx.run() only works in the CURRENT thread.
        # To pass context to a NEW thread, we must run ctx.run INSIDE the new thread.
        
        def thread_bootstrap():
            # "Re-hydrate" the context inside the new thread
            ctx.run(target)

        thread = threading.Thread(target=thread_bootstrap)
        thread.start()
        
        # Block until the Sidecar finishes (Gatekeeper behavior)
        thread.join()

        if error:
            raise error[0]
        
        return result[0] if result else None

async_bridge = AsyncBridge()

