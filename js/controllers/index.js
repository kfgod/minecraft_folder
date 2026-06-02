import { attachSearchController } from './search-controller.js';
import { attachFiltersController } from './filters-controller.js';
import { attachNavShellController } from './nav-shell-controller.js';
import { attachContentController } from './content-controller.js';
import { attachTooltipController } from './tooltip-controller.js';

export function attachAppControllers(app) {
    attachSearchController(app);
    attachFiltersController(app);
    attachContentController(app);
    attachTooltipController(app);
    attachNavShellController(app);
}
