import UIAbility from "@ohos:app.ability.UIAbility";
import type AbilityConstant from "@ohos:app.ability.AbilityConstant";
import type Want from "@ohos:app.ability.Want";
import hilog from "@ohos:hilog";
import type window from "@ohos:window";
import { initAppContext } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
const TAG = 'EntryAbility';
const DOMAIN = 0xFF00;
export default class EntryAbility extends UIAbility {
    async onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
        hilog.info(DOMAIN, TAG, '%{public}s', 'Ability onCreate');
        // 初始化 HttpService 的 context
        try {
            hilog.info(DOMAIN, TAG, '=== 开始初始化 HttpService Context ===');
            await initAppContext(this.context);
            hilog.info(DOMAIN, TAG, '=== HttpService Context 初始化完成 ===');
        }
        catch (e) {
            hilog.error(DOMAIN, TAG, '=== HttpService Context 初始化失败: %{public}s ===', JSON.stringify(e));
        }
    }
    onDestroy() {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onDestroy');
    }
    onWindowStageCreate(windowStage: window.WindowStage) {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onWindowStageCreate');
        windowStage.loadContent('pages/Index', (err, data) => {
            if (err.code) {
                hilog.error(0x0000, TAG, 'Failed to load the content. Cause: %{public}s', JSON.stringify(err) ?? '');
                return;
            }
            hilog.info(0x0000, TAG, 'Succeeded in loading the content. Data: %{public}s', JSON.stringify(data) ?? '');
        });
    }
    onWindowStageDestroy() {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onWindowStageDestroy');
    }
    onForeground() {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onForeground');
    }
    onBackground() {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onBackground');
    }
}
