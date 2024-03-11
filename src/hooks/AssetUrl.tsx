import { createEffect, createSignal, onCleanup, untrack } from "solid-js";

import { DbProject, useDB } from "../db";

export const useAssetUrl = (project: () => DbProject | undefined, asset: () => string | undefined) => {
    const db = useDB();
    const [assetUrl, setAssetUrl] = createSignal<string | undefined>();

    createEffect(async () => {
        const oldAssetUrl = untrack(assetUrl);
        if (oldAssetUrl !== undefined) {
            URL.revokeObjectURL(oldAssetUrl);
        }

        const currentProject = project();
        if (currentProject === undefined) {
            return;
        }

        const currentAsset = asset();
        if (currentAsset === undefined) {
            return;
        }

        const assetInfo = currentProject.assets[currentAsset];
        if (assetInfo === undefined) {
            return;
        }

        const blob = await db.loadAsset(assetInfo.hash);
        if (blob === undefined) {
            return;
        }

        setAssetUrl(URL.createObjectURL(blob));
    });

    onCleanup(() => {
        const finalAssetUrl = assetUrl();
        if (finalAssetUrl !== undefined) {
            URL.revokeObjectURL(finalAssetUrl);
        }
    });

    return assetUrl;
};