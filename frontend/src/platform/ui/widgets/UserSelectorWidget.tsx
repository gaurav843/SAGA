// FILEPATH: frontend/src/platform/ui/widgets/UserSelectorWidget.tsx
// @file: User Selector Widget (Domain Intelligence)
// @author: ansav8@gmail.com
// @description: Asynchronous dropdown that fetches Users from the Universal Resource API.
// @security-level: LEVEL 9 (Role Filtered)

import React from 'react';
import { ProFormSelect } from '@ant-design/pro-components';
import { UniversalResourceService } from '../../../api/services/UniversalResourceService';
import { IconFactory } from '../icons/IconFactory';

export const UserSelectorWidget: React.FC<any> = (props) => {
    // 1. Destructure specific props injected by the Backend Registry
    const { fieldProps, roleFilter, mode, ...rest } = props;

    // 2. Define the Async Loader
    const fetchUsers = async (params: any) => {
        try {
            const filters: Record<string, any> = {};
            
            if (params.keyWords) {
                filters.email = params.keyWords; 
            }

            if (roleFilter) {
                filters.role = roleFilter;
            }

            // Call the Universal Resource API
            const response = await UniversalResourceService.listResourcesApiV1ResourceDomainGet(
                'USER', // Hardcoded Domain for this specific widget
                1,      // Page 1
                50,     // Limit 50 results
                filters
            );

            // Transform to Ant Design Select options
            return (response.items || []).map((user: any) => ({
                label: user.full_name || user.email,
                value: user.id,
            }));

        } catch (error) {
            console.error("Failed to load users", error);
            return [];
        }
    };

    return (
        <ProFormSelect
            {...rest}
            fieldProps={{
                ...fieldProps,
                showSearch: true,
                mode: mode || fieldProps?.mode,
                suffixIcon: <IconFactory icon="antd:UserOutlined" />,
                filterOption: false, // Server-side search
            }}
            placeholder="Select a User..."
            debounceTime={800} // Prevent API spam
            request={fetchUsers}
        />
    );
};
