# C:\Pythonproject\P2\core\kernel\registry\__init__.py
# @file Registry Package Initialization
# @author ansav8@gmail.com
# @description Exposes the registries to the rest of the application.

# 1. The Domain Registry (The Phonebook for Modules)
from .base import DomainContext
from .manager import domain_registry

# 2. The Event Registry (The Catalog of Signals)
# We import 'Signals' from our new explicit file 'event_registry.py'
from .event_registry import Signals

