/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { type JSX } from "react";
import { Button, Heading, Text } from "@vector-im/compound-web";

import { _t } from "../../../languageHandler";
import SdkConfig from "../../../SdkConfig.ts";
import { type ValidatedServerConfig } from "../../../utils/ValidatedServerConfig.ts";
import Spinner from "../elements/Spinner.tsx";

interface Props {
    /**
     * The server config to use for QR code login
     */
    serverConfig: ValidatedServerConfig;
}

/**
 * Sovereign Messenger — Custom Government Welcome Screen
 * Replaces the default Element welcome with a government-branded portal
 */
const DefaultWelcome: React.FC<Props> = ({ serverConfig }) => {
    const brand = SdkConfig.get("brand");
    const branding = SdkConfig.getObject("branding");
    const logoUrl = branding.get("auth_header_logo_url");

    return (
        <div className="mx_DefaultWelcome">
            <a className="mx_DefaultWelcome_logo">
                <img src={logoUrl} alt={brand} />
            </a>
            <Heading as="h1" weight="semibold">
                {brand}
            </Heading>
            <Text size="md" style={{ color: "var(--cpd-color-text-secondary)", marginTop: "4px" }}>
                O'zbekiston Respublikasi Davlat xabar almashish tizimi
            </Text>

            <div className="mx_DefaultWelcome_buttons">
                <Button as="a" href="#/login" kind="primary" size="lg">
                    Tizimga kirish
                </Button>
                <Button as="a" href="#/register" kind="secondary" size="lg">
                    Hisob yaratish
                </Button>
            </div>
        </div>
    );
};

export default DefaultWelcome;
