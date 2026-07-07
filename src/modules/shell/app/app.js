// src/modules/shell/app/app.js
import { LightningElement, track } from 'lwc';
import { subscribe, navigate, setCurrentAppForLinks } from '../../../router';
import { routes } from '../../../routes.config';
import { apps, getAppById, getPersistedAppId, persistAppId, stripAppPrefix } from '../../../apps.config';
import { isAuthDisabled } from '../../../data/authMode.js';
import { onAuthStateChanged } from '../../../data/firebaseAuth.js';
import { getStoredBrand, applyBrand } from 'data/brands';
import { hasApiKey } from 'data/llmGateway';
import ApiKeyModal from 'ui/apiKeyModal';
import Home from 'page/home';
import IconTest from 'page/iconTest';
import Settings from 'page/settings';
import ChurnRateSegment from 'page/churnRateSegment';
import User from 'page/user';
import Contacts from 'page/contacts';
import ContactDetail from 'page/contactDetail';
import ConnectUnify1 from 'page/connectUnify1';
import ConnectUnify2 from 'page/connectUnify2';
import ConnectUnify3 from 'page/connectUnify3';
import GovernSecure1 from 'page/governSecure1';
import GovernSecure2 from 'page/governSecure2';
import GovernSecure3 from 'page/governSecure3';
import ProcessEnrich1 from 'page/processEnrich1';
import ProcessEnrich2 from 'page/processEnrich2';
import ProcessEnrich3 from 'page/processEnrich3';
import ExploreOptimize1 from 'page/exploreOptimize1';
import ExploreOptimize2 from 'page/exploreOptimize2';
import ExploreOptimize3 from 'page/exploreOptimize3';
import NbaModelDetail from 'page/nbaModelDetail';
import PredictModels from 'page/predictModels';
import ClusterModels from 'page/clusterModels';
import ClusterBuilder from 'page/clusterBuilder';
import FeatureManager from 'page/featureManager';
import AnalyzePredict1 from 'page/analyzePredict1';
import AnalyzePredict2 from 'page/analyzePredict2';
import AnalyzePredict3 from 'page/analyzePredict3';
import SegmentAct1 from 'page/segmentAct1';
import SegmentAct2 from 'page/segmentAct2';
import SegmentAct3 from 'page/segmentAct3';
import CompareVersions from 'page/compareVersions';
import NotFound from 'page/notFound';

const ROUTE_COMPONENTS = {
    'page-home': Home,
    'page-icon-test': IconTest,
    'page-settings': Settings,
    'page-churn-rate-segment': ChurnRateSegment,
    'page-user': User,
    'page-contacts': Contacts,
    'page-contact-detail': ContactDetail,
    'page-connect-unify1': ConnectUnify1,
    'page-connect-unify2': ConnectUnify2,
    'page-connect-unify3': ConnectUnify3,
    'page-govern-secure1': GovernSecure1,
    'page-govern-secure2': GovernSecure2,
    'page-govern-secure3': GovernSecure3,
    'page-process-enrich1': ProcessEnrich1,
    'page-process-enrich2': ProcessEnrich2,
    'page-process-enrich3': ProcessEnrich3,
    'page-explore-optimize1': ExploreOptimize1,
    'page-explore-optimize2': ExploreOptimize2,
    'page-explore-optimize3': ExploreOptimize3,
    'page-nba-model-detail': NbaModelDetail,
    'page-predict-models': PredictModels,
    'page-cluster-models': ClusterModels,
    'page-cluster-builder': ClusterBuilder,
    'page-feature-manager': FeatureManager,
    'page-analyze-predict1': AnalyzePredict1,
    'page-analyze-predict2': AnalyzePredict2,
    'page-analyze-predict3': AnalyzePredict3,
    'page-segment-act1': SegmentAct1,
    'page-segment-act2': SegmentAct2,
    'page-segment-act3': SegmentAct3,
    'page-compare-versions': CompareVersions,
    'page-not-found': NotFound,
};

const ROUTE_TO_NAV_PAGE = Object.fromEntries(
    routes
        .filter((r) => r.navPage || r.navHighlight)
        .map((r) => [r.component, r.navPage ?? r.navHighlight])
);

const NAV_PAGE_TO_PATH = Object.fromEntries(
    routes.filter((r) => r.navPage).map((r) => [r.navPage, r.navPath ?? r.path])
);

const STORAGE_KEY_THEME = 'slds-ui-theme';

export default class App extends LightningElement {
    @track route;
    @track _activeTheme = 'light';
    @track selectedPanel = 'agentforce_panel';
    @track isPanelOpen = false;
    @track _activeAppId = getPersistedAppId();
    @track _authUser = null;
    @track _authChecked = false;
    @track _navTooltip = null;

    _redirectPath = '/';
    _unsubscribeAuth;

    get activeApp() {
        return getAppById(this._activeAppId);
    }

    get isFullscreenRoute() {
        return this.route?.component === 'page-compare-versions' || this.route?.fullscreen === true;
    }

    get isVerticalNav() {
        return this.activeApp?.variant === 'vertical';
    }

    get showVerticalNav() {
        return this.isVerticalNav && !this.isFullscreenRoute;
    }

    get panelClasses() {
        return `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-right ${
            this.isPanelOpen ? 'slds-is-open' : ''
        }`;
    }

    get componentCtor() {
        const name = this.route?.component;
        return name ? ROUTE_COMPONENTS[name] ?? null : null;
    }

    get currentNavPage() {
        const name = this.route?.component;
        return name ? (ROUTE_TO_NAV_PAGE[name] ?? '') : 'home';
    }

    get currentPath() {
        return stripAppPrefix(window.location.pathname, this.activeApp);
    }

    get navItems() {
        return routes
            .filter((r) => r.navPage && this.activeApp?.pages?.includes(r.navPage))
            .map((r) => ({ page: r.navPage, label: r.navLabel, path: r.navPath ?? r.path }));
    }

    get verticalNavItems() {
        const isAiModelsPage = this.currentNavPage === 'nba-model-detail' ||
            this.currentPath?.startsWith('/aim-') ||
            this.currentPath === '/nba-model-detail';
        if (isAiModelsPage && this.activeApp.aiModelsNavItems) {
            return this.activeApp.aiModelsNavItems;
        }
        return this.activeApp.navItems;
    }

    get allApps() {
        return apps;
    }

    get activeAppLabel() {
        return this.activeApp.label;
    }

    get activeAppId() {
        return this.activeApp.id;
    }

    get isAuthenticated() {
        return this._authChecked && this._authUser != null;
    }

    get isAuthChecked() {
        return this._authChecked;
    }

    connectedCallback() {
        this._restorePreferences();
        applyBrand(getStoredBrand());
        setCurrentAppForLinks(this._activeAppId);

        // Capture the URL the user wants to visit before auth check
        this._redirectPath = window.location.pathname || '/';

        if (isAuthDisabled()) {
            this._authChecked = true;
            this._authUser = { displayName: 'Local Prototype User' };
            this._promptForApiKeyIfNeeded();
        } else {
            this._unsubscribeAuth = onAuthStateChanged((user) => {
                // wasUnauthenticated is true only after we already confirmed no user was logged in
                const wasUnauthenticated = this._authChecked && !this._authUser;
                this._authChecked = true;
                this._authUser = user;
                if (user && wasUnauthenticated) {
                    navigate(this._redirectPath);
                    this._redirectPath = '/';
                    this._promptForApiKeyIfNeeded();
                } else if (user && !wasUnauthenticated) {
                    this._promptForApiKeyIfNeeded();
                } else if (!user) {
                    // Capture current path so we can return here after sign-in
                    this._redirectPath = window.location.pathname || '/';
                }
            });
        }

        this._unsubscribe = subscribe((route) => {
            this.route = route;
        });
    }

    _restorePreferences() {
        let saved = localStorage.getItem(STORAGE_KEY_THEME);

        if (!saved) {
            const legacyDark = localStorage.getItem('slds-ui-dark-mode');
            const legacyCosmos = localStorage.getItem('slds-ui-cosmos-theme');
            if (legacyCosmos === 'cosmos-light' || legacyCosmos === 'cosmos-dark') {
                saved = legacyCosmos;
            } else if (legacyDark === 'true') {
                saved = 'dark';
            }
            localStorage.removeItem('slds-ui-dark-mode');
            localStorage.removeItem('slds-ui-cosmos-theme');
            if (saved) localStorage.setItem(STORAGE_KEY_THEME, saved);
        }

        if (saved) {
            this._activeTheme = saved;
        }
        this._applyThemeClasses(this._activeTheme);
    }

    disconnectedCallback() {
        this._unsubscribe?.();
        this._unsubscribeAuth?.();
    }

    handleApplyTheme(event) {
        const theme = event.detail?.theme;
        if (!theme) return;
        this._activeTheme = theme;
        this._applyThemeClasses(theme);
        localStorage.setItem(STORAGE_KEY_THEME, theme);
    }

    _applyThemeClasses(theme) {
        const { classList } = document.body;
        classList.remove('slds-color-scheme_dark', 'cosmos-light', 'cosmos-dark');

        if (theme === 'dark') {
            classList.add('slds-color-scheme_dark');
        } else if (theme === 'cosmos-light') {
            classList.add('cosmos-light');
        } else if (theme === 'cosmos-dark') {
            classList.add('slds-color-scheme_dark', 'cosmos-dark');
        }
    }

    handleNavNavigate(event) {
        // vertical nav fires { path }, horizontal nav fires { page } — check path first
        const { page, path } = event.detail ?? {};
        if (path) {
            navigate(path);
        } else if (page) {
            navigate(NAV_PAGE_TO_PATH[page] ?? '/');
        }
    }

    handleAppSwitch(event) {
        const appId = event.detail?.appId;
        if (appId && getAppById(appId)) {
            this._activeAppId = appId;
            persistAppId(appId);
            setCurrentAppForLinks(appId);
            navigate(getAppById(appId).defaultPath);
        }
    }

    handlePanelSelect(event) {
        this.selectedPanel = event.detail?.name ?? this.selectedPanel;
        this.isPanelOpen = true;
    }

    handlePanelClose() {
        this.isPanelOpen = false;
    }

    handleRequestApiKey() {
        this._openApiKeyModal();
    }

    async _openApiKeyModal() {
        await ApiKeyModal.open({ size: 'small' });
    }

    _promptForApiKeyIfNeeded() {
        if (import.meta.env?.MODE === 'gh-pages') {
            return;
        }
        if (!hasApiKey()) {
            this._openApiKeyModal();
        }
    }

    handleNavigateBack() {
        history.back();
    }

    get navTooltipStyle() {
        if (!this._navTooltip) return '';
        return `top:${this._navTooltip.top}px;left:${this._navTooltip.left}px`;
    }

    handleNavTooltipShow(event) {
        this._navTooltip = event.detail;
    }

    handleNavTooltipHide() {
        this._navTooltip = null;
    }
}
