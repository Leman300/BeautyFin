import { effectScope, reactive, hasInjectionContext, getCurrentInstance, inject, toRef, version, unref, ref, watchEffect, watch, h, nextTick, shallowRef, shallowReactive, isReadonly, isRef, isShallow, isReactive, toRaw, defineAsyncComponent, markRaw, readonly, mergeProps, defineComponent, provide, createElementBlock, computed, Suspense, Transition, withCtx, createVNode, useSSRContext, onErrorCaptured, onServerPrefetch, resolveDynamicComponent, createApp } from "vue";
import { useRuntimeConfig as useRuntimeConfig$1 } from "#internal/nitro";
import { $fetch } from "ofetch";
import { createHooks } from "hookable";
import { getContext } from "unctx";
import { sanitizeStatusCode, createError as createError$1 } from "h3";
import { getActiveHead } from "unhead";
import { defineHeadPlugin, composableNames } from "@unhead/shared";
import { START_LOCATION, createMemoryHistory, createRouter, useRoute as useRoute$1, RouterView } from "vue-router";
import { withQuery, hasProtocol, parseURL, isScriptProtocol, joinURL } from "ufo";
import { defu } from "defu";
import "klona";
import "devalue";
import "destr";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSuspense, ssrRenderVNode } from "vue/server-renderer";
const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
const nuxtAppCtx = /* @__PURE__ */ getContext("nuxt-app", {
  asyncContext: false
});
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.10.2";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: reactive({
      data: {},
      state: {},
      once: /* @__PURE__ */ new Set(),
      _errors: {},
      ...{ serverRendered: true }
    }),
    static: {
      data: {}
    },
    runWithContext: (fn) => nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn)),
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: {},
    _payloadRevivers: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
      nuxtApp.ssrContext._payloadReducers = {};
      nuxtApp.payload.path = nuxtApp.ssrContext.url;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin2) {
  if (plugin2.hooks) {
    nuxtApp.hooks.addHooks(plugin2.hooks);
  }
  if (typeof plugin2 === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin2(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  var _a, _b;
  const resolvedPlugins = [];
  const unresolvedPlugins = [];
  const parallels = [];
  const errors = [];
  let promiseDepth = 0;
  async function executePlugin(plugin2) {
    var _a2;
    const unresolvedPluginsForThisPlugin = ((_a2 = plugin2.dependsOn) == null ? void 0 : _a2.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.includes(name))) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin2]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin2).then(async () => {
        if (plugin2._name) {
          resolvedPlugins.push(plugin2._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin2._name)) {
              dependsOn.delete(plugin2._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      });
      if (plugin2.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)));
      } else {
        await promise;
      }
    }
  }
  for (const plugin2 of plugins2) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin2.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    await executePlugin(plugin2);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin2) {
  if (typeof plugin2 === "function") {
    return plugin2;
  }
  const _name = plugin2._name || plugin2.name;
  delete plugin2.name;
  return Object.assign(plugin2.setup || (() => {
  }), plugin2, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
// @__NO_SIDE_EFFECTS__
function tryUseNuxtApp() {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || nuxtAppCtx.tryUse();
  return nuxtAppInstance || null;
}
// @__NO_SIDE_EFFECTS__
function useNuxtApp() {
  const nuxtAppInstance = /* @__PURE__ */ tryUseNuxtApp();
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return (/* @__PURE__ */ useNuxtApp()).$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const LayoutMetaSymbol = Symbol("layout-meta");
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  var _a;
  return (_a = /* @__PURE__ */ useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, (/* @__PURE__ */ useNuxtApp())._route);
  }
  return (/* @__PURE__ */ useNuxtApp())._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if ((/* @__PURE__ */ useNuxtApp())._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : withQuery(to.path || "/", to.query || {}) + (to.hash || "");
  if (options == null ? void 0 : options.open) {
    return Promise.resolve();
  }
  const isExternal = (options == null ? void 0 : options.external) || hasProtocol(toPath, { acceptRelative: true });
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const protocol = parseURL(toPath).protocol;
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = /* @__PURE__ */ useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(/"/g, "%22");
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: location2 }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef((/* @__PURE__ */ useNuxtApp()).payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const error2 = useError();
    if (false)
      ;
    error2.value = error2.value || nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};
version.startsWith("3");
function resolveUnref(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput(ref2, lastKey = "") {
  if (ref2 instanceof Promise)
    return ref2;
  const root = resolveUnref(ref2);
  if (!ref2 || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput(r, lastKey));
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([k, v]) => {
        if (k === "titleTemplate" || k.startsWith("on"))
          return [k, unref(v)];
        return [k, resolveUnrefHeadInput(v, k)];
      })
    );
  }
  return root;
}
defineHeadPlugin({
  hooks: {
    "entries:resolve": function(ctx) {
      for (const entry2 of ctx.entries)
        entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
    }
  }
});
const headSymbol = "usehead";
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey$1 = "__unhead_injection_handler__";
function setHeadInjectionHandler(handler2) {
  _global[globalKey$1] = handler2;
}
function injectHead() {
  if (globalKey$1 in _global) {
    return _global[globalKey$1]();
  }
  const head = inject(headSymbol);
  if (!head && process.env.NODE_ENV !== "production")
    console.warn("Unhead is missing Vue context, falling back to shared context. This may have unexpected results.");
  return head || getActiveHead();
}
function useHead(input, options = {}) {
  const head = options.head || injectHead();
  if (head) {
    if (!head.ssr)
      return clientUseHead(head, input, options);
    return head.push(input, options);
  }
}
function clientUseHead(head, input, options = {}) {
  const deactivated = ref(false);
  const resolvedInput = ref({});
  watchEffect(() => {
    resolvedInput.value = deactivated.value ? {} : resolveUnrefHeadInput(input);
  });
  const entry2 = head.push(resolvedInput.value, options);
  watch(resolvedInput, (e) => {
    entry2.patch(e);
  });
  getCurrentInstance();
  return entry2;
}
const coreComposableNames = [
  "injectHead"
];
({
  "@unhead/vue": [...coreComposableNames, ...composableNames]
});
const unhead_KgADcZ0jPj = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    setHeadInjectionHandler(
      // need a fresh instance of the nuxt app to avoid parallel requests interfering with each other
      () => (/* @__PURE__ */ useNuxtApp()).vueApp._context.provides.usehead
    );
    nuxtApp.vueApp.use(head);
  }
});
function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
_globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
function executeAsync(function_) {
  const restores = [];
  for (const leaveHandler of asyncHandlers) {
    const restore2 = leaveHandler();
    if (restore2) {
      restores.push(restore2);
    }
  }
  const restore = () => {
    for (const restore2 of restores) {
      restore2();
    }
  };
  let awaitable = function_();
  if (awaitable && typeof awaitable === "object" && "catch" in awaitable) {
    awaitable = awaitable.catch((error) => {
      restore();
      throw error;
    });
  }
  return [awaitable, restore];
}
const interpolatePath = (route, match) => {
  return match.path.replace(/(:\w+)\([^)]+\)/g, "$1").replace(/(:\w+)[?+*]/g, "$1").replace(/:\w+/g, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
};
const generateRouteKey$1 = (routeProps, override) => {
  const matchedRoute = routeProps.route.matched.find((m) => {
    var _a;
    return ((_a = m.components) == null ? void 0 : _a.default) === routeProps.Component.type;
  });
  const source = override ?? (matchedRoute == null ? void 0 : matchedRoute.meta.key) ?? (matchedRoute && interpolatePath(routeProps.route, matchedRoute));
  return typeof source === "function" ? source(routeProps.route) : source;
};
const wrapInKeepAlive = (props, children) => {
  return { default: () => children };
};
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
const __nuxt_page_meta = null;
const _routes = [
  {
    name: "index",
    path: "/",
    meta: {},
    alias: [],
    redirect: __nuxt_page_meta == null ? void 0 : __nuxt_page_meta.redirect,
    component: () => import("./_nuxt/index-pzSAvDL5.js").then((m) => m.default || m)
  }
];
const _wrapIf = (component, props, slots) => {
  props = props === true ? {} : props;
  return { default: () => {
    var _a;
    return props ? h(component, props, slots) : (_a = slots.default) == null ? void 0 : _a.call(slots);
  } };
};
function generateRouteKey(route) {
  const source = (route == null ? void 0 : route.meta.key) ?? route.path.replace(/(:\w+)\([^)]+\)/g, "$1").replace(/(:\w+)[?+*]/g, "$1").replace(/:\w+/g, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
  return typeof source === "function" ? source(route) : source;
}
function isChangingPage(to, from) {
  if (to === from || from === START_LOCATION) {
    return false;
  }
  if (generateRouteKey(to) !== generateRouteKey(from)) {
    return true;
  }
  const areComponentsSame = to.matched.every(
    (comp, index2) => {
      var _a, _b;
      return comp.components && comp.components.default === ((_b = (_a = from.matched[index2]) == null ? void 0 : _a.components) == null ? void 0 : _b.default);
    }
  );
  if (areComponentsSame) {
    return false;
  }
  return true;
}
const appLayoutTransition = false;
const appPageTransition = false;
const appKeepalive = false;
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const routerOptions0 = {
  scrollBehavior(to, from, savedPosition) {
    var _a;
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const behavior = ((_a = useRouter().options) == null ? void 0 : _a.scrollBehaviorType) ?? "auto";
    let position = savedPosition || void 0;
    const routeAllowsScrollToTop = typeof to.meta.scrollToTop === "function" ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop;
    if (!position && from && to && routeAllowsScrollToTop !== false && isChangingPage(to, from)) {
      position = { left: 0, top: 0 };
    }
    if (to.path === from.path) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
      }
    }
    const hasTransition = (route) => !!(route.meta.pageTransition ?? appPageTransition);
    const hookToWait = hasTransition(from) && hasTransition(to) ? "page:transition:finish" : "page:finish";
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce(hookToWait, async () => {
        await nextTick();
        if (to.hash) {
          position = { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
        }
        resolve(position);
      });
    });
  }
};
function _getHashElementScrollMarginTop(selector) {
  try {
    const elem = (void 0).querySelector(selector);
    if (elem) {
      return parseFloat(getComputedStyle(elem).scrollMarginTop);
    }
  } catch {
  }
  return 0;
}
const configRouterOptions = {
  hashMode: false,
  scrollBehaviorType: "auto"
};
const routerOptions = {
  ...configRouterOptions,
  ...routerOptions0
};
const validate = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  var _a;
  let __temp, __restore;
  if (!((_a = to.meta) == null ? void 0 : _a.validate)) {
    return;
  }
  useRouter();
  const result = ([__temp, __restore] = executeAsync(() => Promise.resolve(to.meta.validate(to))), __temp = await __temp, __restore(), __temp);
  if (result === true) {
    return;
  }
  {
    return result;
  }
});
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  validate,
  manifest_45route_45rule
];
const namedMiddleware = {};
const plugin = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  async setup(nuxtApp) {
    var _a, _b, _c;
    let __temp, __restore;
    let routerBase = (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    if (routerOptions.hashMode && !routerBase.includes("#")) {
      routerBase += "#";
    }
    const history = ((_a = routerOptions.history) == null ? void 0 : _a.call(routerOptions, routerBase)) ?? createMemoryHistory(routerBase);
    const routes = ((_b = routerOptions.routes) == null ? void 0 : _b.call(routerOptions, _routes)) ?? _routes;
    let startPosition;
    const initialURL = nuxtApp.ssrContext.url;
    const router = createRouter({
      ...routerOptions,
      scrollBehavior: (to, from, savedPosition) => {
        if (from === START_LOCATION) {
          startPosition = savedPosition;
          return;
        }
        if (routerOptions.scrollBehavior) {
          router.options.scrollBehavior = routerOptions.scrollBehavior;
          if ("scrollRestoration" in (void 0).history) {
            const unsub = router.beforeEach(() => {
              unsub();
              (void 0).history.scrollRestoration = "manual";
            });
          }
          return routerOptions.scrollBehavior(to, START_LOCATION, startPosition || savedPosition);
        }
      },
      history,
      routes
    });
    nuxtApp.vueApp.use(router);
    const previousRoute = shallowRef(router.currentRoute.value);
    router.afterEach((_to, from) => {
      previousRoute.value = from;
    });
    Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
      get: () => previousRoute.value
    });
    const _route = shallowRef(router.resolve(initialURL));
    const syncCurrentRoute = () => {
      _route.value = router.currentRoute.value;
    };
    nuxtApp.hook("page:finish", syncCurrentRoute);
    router.afterEach((to, from) => {
      var _a2, _b2, _c2, _d;
      if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d = (_c2 = from.matched[0]) == null ? void 0 : _c2.components) == null ? void 0 : _d.default)) {
        syncCurrentRoute();
      }
    });
    const route = {};
    for (const key in _route.value) {
      Object.defineProperty(route, key, {
        get: () => _route.value[key]
      });
    }
    nuxtApp._route = shallowReactive(route);
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    useError();
    try {
      if (true) {
        ;
        [__temp, __restore] = executeAsync(() => router.push(initialURL)), await __temp, __restore();
        ;
      }
      ;
      [__temp, __restore] = executeAsync(() => router.isReady()), await __temp, __restore();
      ;
    } catch (error2) {
      [__temp, __restore] = executeAsync(() => nuxtApp.runWithContext(() => showError(error2))), await __temp, __restore();
    }
    if ((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext) {
      return { provide: { router } };
    }
    const initialLayout = nuxtApp.payload.state._layout;
    router.beforeEach(async (to, from) => {
      var _a2, _b2;
      await nuxtApp.callHook("page:loading:start");
      to.meta = reactive(to.meta);
      if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
        to.meta.layout = initialLayout;
      }
      nuxtApp._processingMiddleware = true;
      if (!((_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.islandContext)) {
        const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
        for (const component of to.matched) {
          const componentMiddleware = component.meta.middleware;
          if (!componentMiddleware) {
            continue;
          }
          for (const entry2 of toArray(componentMiddleware)) {
            middlewareEntries.add(entry2);
          }
        }
        for (const entry2 of middlewareEntries) {
          const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_b2 = namedMiddleware[entry2]) == null ? void 0 : _b2.call(namedMiddleware).then((r) => r.default || r)) : entry2;
          if (!middleware) {
            throw new Error(`Unknown route middleware: '${entry2}'.`);
          }
          const result = await nuxtApp.runWithContext(() => middleware(to, from));
          {
            if (result === false || result instanceof Error) {
              const error2 = result || createError$1({
                statusCode: 404,
                statusMessage: `Page Not Found: ${initialURL}`
              });
              await nuxtApp.runWithContext(() => showError(error2));
              return false;
            }
          }
          if (result === true) {
            continue;
          }
          if (result || result === false) {
            return result;
          }
        }
      }
    });
    router.onError(async () => {
      delete nuxtApp._processingMiddleware;
      await nuxtApp.callHook("page:loading:end");
    });
    router.afterEach(async (to, _from, failure) => {
      delete nuxtApp._processingMiddleware;
      if (failure) {
        await nuxtApp.callHook("page:loading:end");
      }
      if ((failure == null ? void 0 : failure.type) === 4) {
        return;
      }
      if (to.matched.length === 0) {
        await nuxtApp.runWithContext(() => showError(createError$1({
          statusCode: 404,
          fatal: false,
          statusMessage: `Page not found: ${to.fullPath}`,
          data: {
            path: to.fullPath
          }
        })));
      } else if (to.redirectedFrom && to.fullPath !== initialURL) {
        await nuxtApp.runWithContext(() => navigateTo(to.fullPath || "/"));
      }
    });
    nuxtApp.hooks.hookOnce("app:created", async () => {
      try {
        await router.replace({
          ...router.resolve(initialURL),
          name: void 0,
          // #4920, #4982
          force: true
        });
        router.options.scrollBehavior = routerOptions.scrollBehavior;
      } catch (error2) {
        await nuxtApp.runWithContext(() => showError(error2));
      }
    });
    return { provide: { router } };
  }
});
function definePayloadReducer(name, reduce) {
  {
    (/* @__PURE__ */ useNuxtApp()).ssrContext._payloadReducers[name] = reduce;
  }
}
const reducers = {
  NuxtError: (data) => isNuxtError(data) && data.toJSON(),
  EmptyShallowRef: (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  EmptyRef: (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  ShallowRef: (data) => isRef(data) && isShallow(data) && data.value,
  ShallowReactive: (data) => isReactive(data) && isShallow(data) && toRaw(data),
  Ref: (data) => isRef(data) && data.value,
  Reactive: (data) => isReactive(data) && toRaw(data)
};
const revive_payload_server_eJ33V7gbc6 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const reducer in reducers) {
      definePayloadReducer(reducer, reducers[reducer]);
    }
  }
});
const LazyIcon = defineAsyncComponent(() => import("./_nuxt/Icon-7e9MRvna.js").then((r) => r.default));
const LazyIconCSS = defineAsyncComponent(() => import("./_nuxt/IconCSS-cD2IeLIz.js").then((r) => r.default));
const LazyAutoComplete = defineAsyncComponent(() => import("./_nuxt/autocomplete.esm-1nLbMjku.js").then((r) => r.default));
const LazyCalendar = defineAsyncComponent(() => import("./_nuxt/calendar.esm-AHDWIzTX.js").then((r) => r.default));
const LazyCascadeSelect = defineAsyncComponent(() => import("./_nuxt/cascadeselect.esm-Hq7UEPt5.js").then((r) => r.default));
const LazyCheckbox = defineAsyncComponent(() => import("./_nuxt/checkbox.esm-e5tpuIku.js").then((r) => r.default));
const LazyChips = defineAsyncComponent(() => import("./_nuxt/chips.esm-tq5vd-c6.js").then((r) => r.default));
const LazyColorPicker = defineAsyncComponent(() => import("./_nuxt/colorpicker.esm-d7gNWDGj.js").then((r) => r.default));
const LazyDropdown = defineAsyncComponent(() => import("./_nuxt/dropdown.esm-QrsXhytx.js").then((r) => r.default));
const LazyInputGroup = defineAsyncComponent(() => import("./_nuxt/inputgroup.esm-8Eh6rpej.js").then((r) => r.default));
const LazyInputGroupAddon = defineAsyncComponent(() => import("./_nuxt/inputgroupaddon.esm-MH5qfS7O.js").then((r) => r.default));
const LazyInputMask = defineAsyncComponent(() => import("./_nuxt/inputmask.esm-sTbyNlOc.js").then((r) => r.default));
const LazyInputNumber = defineAsyncComponent(() => import("./_nuxt/inputnumber.esm-LDSdHaqs.js").then((r) => r.default));
const LazyInputSwitch = defineAsyncComponent(() => import("./_nuxt/inputswitch.esm-R-ptDww2.js").then((r) => r.default));
const LazyInputText = defineAsyncComponent(() => import("./_nuxt/inputtext.esm-NlbC8zTk.js").then((r) => r.default));
const LazyKnob = defineAsyncComponent(() => import("./_nuxt/knob.esm-aP9xl7k0.js").then((r) => r.default));
const LazyListbox = defineAsyncComponent(() => import("./_nuxt/listbox.esm-6u27wNoS.js").then((r) => r.default));
const LazyMultiSelect = defineAsyncComponent(() => import("./_nuxt/multiselect.esm-sY3cqeu5.js").then((r) => r.default));
const LazyPassword = defineAsyncComponent(() => import("./_nuxt/password.esm-yXl7ohLe.js").then((r) => r.default));
const LazyRadioButton = defineAsyncComponent(() => import("./_nuxt/radiobutton.esm-9qOGOacU.js").then((r) => r.default));
const LazyRating = defineAsyncComponent(() => import("./_nuxt/rating.esm-2b-3pqD8.js").then((r) => r.default));
const LazySelectButton = defineAsyncComponent(() => import("./_nuxt/selectbutton.esm-TEoummIP.js").then((r) => r.default));
const LazySlider = defineAsyncComponent(() => import("./_nuxt/slider.esm-lufjtR_i.js").then((r) => r.default));
const LazyTextarea = defineAsyncComponent(() => import("./_nuxt/textarea.esm-6P_Do3DJ.js").then((r) => r.default));
const LazyToggleButton = defineAsyncComponent(() => import("./_nuxt/togglebutton.esm-RkpNzG2W.js").then((r) => r.default));
const LazyTreeSelect = defineAsyncComponent(() => import("./_nuxt/treeselect.esm-AhSCpPnI.js").then((r) => r.default));
const LazyTriStateCheckbox = defineAsyncComponent(() => import("./_nuxt/tristatecheckbox.esm-_HW5z9uh.js").then((r) => r.default));
const LazyButton = defineAsyncComponent(() => import("./_nuxt/button.esm-dqSaw3i9.js").then((r) => r.default));
const LazySpeedDial = defineAsyncComponent(() => import("./_nuxt/speeddial.esm-XlrdwGsu.js").then((r) => r.default));
const LazySplitButton = defineAsyncComponent(() => import("./_nuxt/splitbutton.esm-RRLpH90k.js").then((r) => r.default));
const LazyColumn = defineAsyncComponent(() => import("./_nuxt/column.esm-zkGmWsq6.js").then((r) => r.default));
const LazyRow = defineAsyncComponent(() => import("./_nuxt/row.esm-cCmxTHlC.js").then((r) => r.default));
const LazyColumnGroup = defineAsyncComponent(() => import("./_nuxt/columngroup.esm-bTFohy6f.js").then((r) => r.default));
const LazyDataTable = defineAsyncComponent(() => import("./_nuxt/datatable.esm-DdFk3V3Z.js").then((r) => r.default));
const LazyDataView = defineAsyncComponent(() => import("./_nuxt/dataview.esm-y10E9Txd.js").then((r) => r.default));
const LazyDataViewLayoutOptions = defineAsyncComponent(() => import("./_nuxt/dataviewlayoutoptions.esm--5jVALlb.js").then((r) => r.default));
const LazyOrderList = defineAsyncComponent(() => import("./_nuxt/orderlist.esm-g6Wmrx8F.js").then((r) => r.default));
const LazyOrganizationChart = defineAsyncComponent(() => import("./_nuxt/organizationchart.esm-J9ICCMb_.js").then((r) => r.default));
const LazyPaginator = defineAsyncComponent(() => import("./_nuxt/paginator.esm-MvrZ_jDu.js").then((r) => r.default));
const LazyPickList = defineAsyncComponent(() => import("./_nuxt/picklist.esm-hA7NQGl_.js").then((r) => r.default));
const LazyTree = defineAsyncComponent(() => import("./_nuxt/tree.esm-dgaGOksT.js").then((r) => r.default));
const LazyTreeTable = defineAsyncComponent(() => import("./_nuxt/treetable.esm-bWOMIZZX.js").then((r) => r.default));
const LazyTimeline = defineAsyncComponent(() => import("./_nuxt/timeline.esm-j96HHVzu.js").then((r) => r.default));
const LazyVirtualScroller = defineAsyncComponent(() => import("./_nuxt/virtualscroller.esm-9Z9K4iUN.js").then((r) => r.default));
const LazyAccordion = defineAsyncComponent(() => import("./_nuxt/accordion.esm-QpRJZqrZ.js").then((r) => r.default));
const LazyAccordionTab = defineAsyncComponent(() => import("./_nuxt/accordiontab.esm-LgrpvlEW.js").then((r) => r.default));
const LazyCard = defineAsyncComponent(() => import("./_nuxt/card.esm-FasCIXwp.js").then((r) => r.default));
const LazyDeferredContent = defineAsyncComponent(() => import("./_nuxt/deferredcontent.esm-s6Gqv9c4.js").then((r) => r.default));
const LazyDivider = defineAsyncComponent(() => import("./_nuxt/divider.esm-DwTbjnh6.js").then((r) => r.default));
const LazyFieldset = defineAsyncComponent(() => import("./_nuxt/fieldset.esm-eyMWot8h.js").then((r) => r.default));
const LazyPanel = defineAsyncComponent(() => import("./_nuxt/panel.esm-wyBiLBXd.js").then((r) => r.default));
const LazyScrollPanel = defineAsyncComponent(() => import("./_nuxt/scrollpanel.esm-Og5B3qLy.js").then((r) => r.default));
const LazySplitter = defineAsyncComponent(() => import("./_nuxt/splitter.esm-jolA2th6.js").then((r) => r.default));
const LazySplitterPanel = defineAsyncComponent(() => import("./_nuxt/splitterpanel.esm-gRv4lCMa.js").then((r) => r.default));
const LazyTabView = defineAsyncComponent(() => import("./_nuxt/tabview.esm-0eA1rNyu.js").then((r) => r.default));
const LazyTabPanel = defineAsyncComponent(() => import("./_nuxt/tabpanel.esm-KCMmveA8.js").then((r) => r.default));
const LazyToolbar = defineAsyncComponent(() => import("./_nuxt/toolbar.esm-VibmCV3p.js").then((r) => r.default));
const LazyConfirmDialog = defineAsyncComponent(() => import("./_nuxt/confirmdialog.esm--spQ4ukF.js").then((r) => r.default));
const LazyConfirmPopup = defineAsyncComponent(() => import("./_nuxt/confirmpopup.esm-2qBIdkH_.js").then((r) => r.default));
const LazyDialog = defineAsyncComponent(() => import("./_nuxt/dialog.esm-n57VyyiY.js").then((r) => r.default));
const LazyDynamicDialog = defineAsyncComponent(() => import("./_nuxt/dynamicdialog.esm-kXAoNtk6.js").then((r) => r.default));
const LazyOverlayPanel = defineAsyncComponent(() => import("./_nuxt/overlaypanel.esm-U9W8K5wz.js").then((r) => r.default));
const LazySidebar = defineAsyncComponent(() => import("./_nuxt/sidebar.esm-6MrniF02.js").then((r) => r.default));
const LazyFileUpload = defineAsyncComponent(() => import("./_nuxt/fileupload.esm-6Xvxcl82.js").then((r) => r.default));
const LazyBreadcrumb = defineAsyncComponent(() => import("./_nuxt/breadcrumb.esm-UighNEfT.js").then((r) => r.default));
const LazyContextMenu = defineAsyncComponent(() => import("./_nuxt/contextmenu.esm-uLl_YDD-.js").then((r) => r.default));
const LazyDock = defineAsyncComponent(() => import("./_nuxt/dock.esm-m2UPzrsp.js").then((r) => r.default));
const LazyMenu = defineAsyncComponent(() => import("./_nuxt/menu.esm-nfqGfx2z.js").then((r) => r.default));
const LazyMenubar = defineAsyncComponent(() => import("./_nuxt/menubar.esm-ZkNxEeRa.js").then((r) => r.default));
const LazyMegaMenu = defineAsyncComponent(() => import("./_nuxt/megamenu.esm-T7IpnFe6.js").then((r) => r.default));
const LazyPanelMenu = defineAsyncComponent(() => import("./_nuxt/panelmenu.esm-bb1GhsrH.js").then((r) => r.default));
const LazySteps = defineAsyncComponent(() => import("./_nuxt/steps.esm-L0S2acSZ.js").then((r) => r.default));
const LazyTabMenu = defineAsyncComponent(() => import("./_nuxt/tabmenu.esm-4mhcmOYD.js").then((r) => r.default));
const LazyTieredMenu = defineAsyncComponent(() => import("./_nuxt/tieredmenu.esm-XKrFKd1e.js").then((r) => r.default));
const LazyMessage = defineAsyncComponent(() => import("./_nuxt/message.esm-3U7rySjW.js").then((r) => r.default));
const LazyInlineMessage = defineAsyncComponent(() => import("./_nuxt/inlinemessage.esm-KH20f6uu.js").then((r) => r.default));
const LazyToast = defineAsyncComponent(() => import("./_nuxt/toast.esm-x-WWG0y8.js").then((r) => r.default));
const LazyCarousel = defineAsyncComponent(() => import("./_nuxt/carousel.esm-OnbjgA3M.js").then((r) => r.default));
const LazyGalleria = defineAsyncComponent(() => import("./_nuxt/galleria.esm-8_6gZyeU.js").then((r) => r.default));
const LazyImage = defineAsyncComponent(() => import("./_nuxt/image.esm-6KQfaGYe.js").then((r) => r.default));
const LazyAvatar = defineAsyncComponent(() => import("./_nuxt/avatar.esm-csVxHIHJ.js").then((r) => r.default));
const LazyAvatarGroup = defineAsyncComponent(() => import("./_nuxt/avatargroup.esm-y5gBkMK1.js").then((r) => r.default));
const LazyBadge = defineAsyncComponent(() => import("./_nuxt/badge.esm-ghUiACLO.js").then((r) => r.default));
const LazyBlockUI = defineAsyncComponent(() => import("./_nuxt/blockui.esm-jgj_-VCK.js").then((r) => r.default));
const LazyChip = defineAsyncComponent(() => import("./_nuxt/chip.esm-i1uTEnC7.js").then((r) => r.default));
const LazyInplace = defineAsyncComponent(() => import("./_nuxt/inplace.esm-xILDmcrQ.js").then((r) => r.default));
const LazyScrollTop = defineAsyncComponent(() => import("./_nuxt/scrolltop.esm-bZLioEm2.js").then((r) => r.default));
const LazySkeleton = defineAsyncComponent(() => import("./_nuxt/skeleton.esm--K07c-yV.js").then((r) => r.default));
const LazyProgressBar = defineAsyncComponent(() => import("./_nuxt/progressbar.esm-qAS-FjpG.js").then((r) => r.default));
const LazyProgressSpinner = defineAsyncComponent(() => import("./_nuxt/progressspinner.esm-aeK5VNiv.js").then((r) => r.default));
const LazyTag = defineAsyncComponent(() => import("./_nuxt/tag.esm-Qzb9WjLW.js").then((r) => r.default));
const LazyTerminal = defineAsyncComponent(() => import("./_nuxt/terminal.esm-G_LOx-Dr.js").then((r) => r.default));
const lazyGlobalComponents = [
  ["Icon", LazyIcon],
  ["IconCSS", LazyIconCSS],
  ["AutoComplete", LazyAutoComplete],
  ["Calendar", LazyCalendar],
  ["CascadeSelect", LazyCascadeSelect],
  ["Checkbox", LazyCheckbox],
  ["Chips", LazyChips],
  ["ColorPicker", LazyColorPicker],
  ["Dropdown", LazyDropdown],
  ["InputGroup", LazyInputGroup],
  ["InputGroupAddon", LazyInputGroupAddon],
  ["InputMask", LazyInputMask],
  ["InputNumber", LazyInputNumber],
  ["InputSwitch", LazyInputSwitch],
  ["InputText", LazyInputText],
  ["Knob", LazyKnob],
  ["Listbox", LazyListbox],
  ["MultiSelect", LazyMultiSelect],
  ["Password", LazyPassword],
  ["RadioButton", LazyRadioButton],
  ["Rating", LazyRating],
  ["SelectButton", LazySelectButton],
  ["Slider", LazySlider],
  ["Textarea", LazyTextarea],
  ["ToggleButton", LazyToggleButton],
  ["TreeSelect", LazyTreeSelect],
  ["TriStateCheckbox", LazyTriStateCheckbox],
  ["Button", LazyButton],
  ["SpeedDial", LazySpeedDial],
  ["SplitButton", LazySplitButton],
  ["Column", LazyColumn],
  ["Row", LazyRow],
  ["ColumnGroup", LazyColumnGroup],
  ["DataTable", LazyDataTable],
  ["DataView", LazyDataView],
  ["DataViewLayoutOptions", LazyDataViewLayoutOptions],
  ["OrderList", LazyOrderList],
  ["OrganizationChart", LazyOrganizationChart],
  ["Paginator", LazyPaginator],
  ["PickList", LazyPickList],
  ["Tree", LazyTree],
  ["TreeTable", LazyTreeTable],
  ["Timeline", LazyTimeline],
  ["VirtualScroller", LazyVirtualScroller],
  ["Accordion", LazyAccordion],
  ["AccordionTab", LazyAccordionTab],
  ["Card", LazyCard],
  ["DeferredContent", LazyDeferredContent],
  ["Divider", LazyDivider],
  ["Fieldset", LazyFieldset],
  ["Panel", LazyPanel],
  ["ScrollPanel", LazyScrollPanel],
  ["Splitter", LazySplitter],
  ["SplitterPanel", LazySplitterPanel],
  ["TabView", LazyTabView],
  ["TabPanel", LazyTabPanel],
  ["Toolbar", LazyToolbar],
  ["ConfirmDialog", LazyConfirmDialog],
  ["ConfirmPopup", LazyConfirmPopup],
  ["Dialog", LazyDialog],
  ["DynamicDialog", LazyDynamicDialog],
  ["OverlayPanel", LazyOverlayPanel],
  ["Sidebar", LazySidebar],
  ["FileUpload", LazyFileUpload],
  ["Breadcrumb", LazyBreadcrumb],
  ["ContextMenu", LazyContextMenu],
  ["Dock", LazyDock],
  ["Menu", LazyMenu],
  ["Menubar", LazyMenubar],
  ["MegaMenu", LazyMegaMenu],
  ["PanelMenu", LazyPanelMenu],
  ["Steps", LazySteps],
  ["TabMenu", LazyTabMenu],
  ["TieredMenu", LazyTieredMenu],
  ["Message", LazyMessage],
  ["InlineMessage", LazyInlineMessage],
  ["Toast", LazyToast],
  ["Carousel", LazyCarousel],
  ["Galleria", LazyGalleria],
  ["Image", LazyImage],
  ["Avatar", LazyAvatar],
  ["AvatarGroup", LazyAvatarGroup],
  ["Badge", LazyBadge],
  ["BlockUI", LazyBlockUI],
  ["Chip", LazyChip],
  ["Inplace", LazyInplace],
  ["ScrollTop", LazyScrollTop],
  ["Skeleton", LazySkeleton],
  ["ProgressBar", LazyProgressBar],
  ["ProgressSpinner", LazyProgressSpinner],
  ["Tag", LazyTag],
  ["Terminal", LazyTerminal]
];
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components",
  setup(nuxtApp) {
    for (const [name, component] of lazyGlobalComponents) {
      nuxtApp.vueApp.component(name, component);
      nuxtApp.vueApp.component("Lazy" + name, component);
    }
  }
});
function _createForOfIteratorHelper$1(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray$3$1(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it)
        o = it;
      var i = 0;
      var F = function F2() {
      };
      return { s: F, n: function n() {
        if (i >= o.length)
          return { done: true };
        return { done: false, value: o[i++] };
      }, e: function e(_e) {
        throw _e;
      }, f: F };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true, didErr = false, err;
  return { s: function s() {
    it = it.call(o);
  }, n: function n() {
    var step = it.next();
    normalCompletion = step.done;
    return step;
  }, e: function e(_e2) {
    didErr = true;
    err = _e2;
  }, f: function f() {
    try {
      if (!normalCompletion && it["return"] != null)
        it["return"]();
    } finally {
      if (didErr)
        throw err;
    }
  } };
}
function _toConsumableArray$3(arr) {
  return _arrayWithoutHoles$3(arr) || _iterableToArray$3(arr) || _unsupportedIterableToArray$3$1(arr) || _nonIterableSpread$3();
}
function _nonIterableSpread$3() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _iterableToArray$3(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _arrayWithoutHoles$3(arr) {
  if (Array.isArray(arr))
    return _arrayLikeToArray$3$1(arr);
}
function _typeof$3$1(o) {
  "@babel/helpers - typeof";
  return _typeof$3$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$3$1(o);
}
function _slicedToArray$1$1(arr, i) {
  return _arrayWithHoles$1$1(arr) || _iterableToArrayLimit$1$1(arr, i) || _unsupportedIterableToArray$3$1(arr, i) || _nonIterableRest$1$1();
}
function _nonIterableRest$1$1() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$3$1(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$3$1(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$3$1(o, minLen);
}
function _arrayLikeToArray$3$1(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit$1$1(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t)
          return;
        f = false;
      } else
        for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true)
          ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u))
          return;
      } finally {
        if (o)
          throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$1$1(arr) {
  if (Array.isArray(arr))
    return arr;
}
var DomHandler = {
  innerWidth: function innerWidth(el) {
    if (el) {
      var width2 = el.offsetWidth;
      var style = getComputedStyle(el);
      width2 += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      return width2;
    }
    return 0;
  },
  width: function width(el) {
    if (el) {
      var width2 = el.offsetWidth;
      var style = getComputedStyle(el);
      width2 -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      return width2;
    }
    return 0;
  },
  getWindowScrollTop: function getWindowScrollTop() {
    var doc = (void 0).documentElement;
    return ((void 0).pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
  },
  getWindowScrollLeft: function getWindowScrollLeft() {
    var doc = (void 0).documentElement;
    return ((void 0).pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
  },
  getOuterWidth: function getOuterWidth(el, margin) {
    if (el) {
      var width2 = el.offsetWidth;
      if (margin) {
        var style = getComputedStyle(el);
        width2 += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
      }
      return width2;
    }
    return 0;
  },
  getOuterHeight: function getOuterHeight(el, margin) {
    if (el) {
      var height = el.offsetHeight;
      if (margin) {
        var style = getComputedStyle(el);
        height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      }
      return height;
    }
    return 0;
  },
  getClientHeight: function getClientHeight(el, margin) {
    if (el) {
      var height = el.clientHeight;
      if (margin) {
        var style = getComputedStyle(el);
        height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      }
      return height;
    }
    return 0;
  },
  getViewport: function getViewport() {
    var win = void 0, d = void 0, e = d.documentElement, g = d.getElementsByTagName("body")[0], w = win.innerWidth || e.clientWidth || g.clientWidth, h2 = win.innerHeight || e.clientHeight || g.clientHeight;
    return {
      width: w,
      height: h2
    };
  },
  getOffset: function getOffset(el) {
    if (el) {
      var rect = el.getBoundingClientRect();
      return {
        top: rect.top + ((void 0).pageYOffset || (void 0).documentElement.scrollTop || (void 0).body.scrollTop || 0),
        left: rect.left + ((void 0).pageXOffset || (void 0).documentElement.scrollLeft || (void 0).body.scrollLeft || 0)
      };
    }
    return {
      top: "auto",
      left: "auto"
    };
  },
  index: function index(element) {
    if (element) {
      var _this$getParentNode;
      var children = (_this$getParentNode = this.getParentNode(element)) === null || _this$getParentNode === void 0 ? void 0 : _this$getParentNode.childNodes;
      var num = 0;
      for (var i = 0; i < children.length; i++) {
        if (children[i] === element)
          return num;
        if (children[i].nodeType === 1)
          num++;
      }
    }
    return -1;
  },
  addMultipleClasses: function addMultipleClasses(element, classNames) {
    var _this = this;
    if (element && classNames) {
      [classNames].flat().filter(Boolean).forEach(function(cNames) {
        return cNames.split(" ").forEach(function(className) {
          return _this.addClass(element, className);
        });
      });
    }
  },
  removeMultipleClasses: function removeMultipleClasses(element, classNames) {
    var _this2 = this;
    if (element && classNames) {
      [classNames].flat().filter(Boolean).forEach(function(cNames) {
        return cNames.split(" ").forEach(function(className) {
          return _this2.removeClass(element, className);
        });
      });
    }
  },
  addClass: function addClass(element, className) {
    if (element && className && !this.hasClass(element, className)) {
      if (element.classList)
        element.classList.add(className);
      else
        element.className += " " + className;
    }
  },
  removeClass: function removeClass(element, className) {
    if (element && className) {
      if (element.classList)
        element.classList.remove(className);
      else
        element.className = element.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"), " ");
    }
  },
  hasClass: function hasClass(element, className) {
    if (element) {
      if (element.classList)
        return element.classList.contains(className);
      else
        return new RegExp("(^| )" + className + "( |$)", "gi").test(element.className);
    }
    return false;
  },
  addStyles: function addStyles(element) {
    var styles = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (element) {
      Object.entries(styles).forEach(function(_ref) {
        var _ref2 = _slicedToArray$1$1(_ref, 2), key = _ref2[0], value = _ref2[1];
        return element.style[key] = value;
      });
    }
  },
  find: function find(element, selector) {
    return this.isElement(element) ? element.querySelectorAll(selector) : [];
  },
  findSingle: function findSingle(element, selector) {
    return this.isElement(element) ? element.querySelector(selector) : null;
  },
  createElement: function createElement(type) {
    var attributes = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (type) {
      var element = (void 0).createElement(type);
      this.setAttributes(element, attributes);
      for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        children[_key - 2] = arguments[_key];
      }
      element.append.apply(element, children);
      return element;
    }
    return void 0;
  },
  setAttribute: function setAttribute(element) {
    var attribute = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    var value = arguments.length > 2 ? arguments[2] : void 0;
    if (this.isElement(element) && value !== null && value !== void 0) {
      element.setAttribute(attribute, value);
    }
  },
  setAttributes: function setAttributes(element) {
    var _this3 = this;
    var attributes = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (this.isElement(element)) {
      var computedStyles = function computedStyles2(rule, value) {
        var _element$$attrs, _element$$attrs2;
        var styles = element !== null && element !== void 0 && (_element$$attrs = element.$attrs) !== null && _element$$attrs !== void 0 && _element$$attrs[rule] ? [element === null || element === void 0 || (_element$$attrs2 = element.$attrs) === null || _element$$attrs2 === void 0 ? void 0 : _element$$attrs2[rule]] : [];
        return [value].flat().reduce(function(cv, v) {
          if (v !== null && v !== void 0) {
            var type = _typeof$3$1(v);
            if (type === "string" || type === "number") {
              cv.push(v);
            } else if (type === "object") {
              var _cv = Array.isArray(v) ? computedStyles2(rule, v) : Object.entries(v).map(function(_ref3) {
                var _ref4 = _slicedToArray$1$1(_ref3, 2), _k = _ref4[0], _v = _ref4[1];
                return rule === "style" && (!!_v || _v === 0) ? "".concat(_k.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(), ":").concat(_v) : !!_v ? _k : void 0;
              });
              cv = _cv.length ? cv.concat(_cv.filter(function(c) {
                return !!c;
              })) : cv;
            }
          }
          return cv;
        }, styles);
      };
      Object.entries(attributes).forEach(function(_ref5) {
        var _ref6 = _slicedToArray$1$1(_ref5, 2), key = _ref6[0], value = _ref6[1];
        if (value !== void 0 && value !== null) {
          var matchedEvent = key.match(/^on(.+)/);
          if (matchedEvent) {
            element.addEventListener(matchedEvent[1].toLowerCase(), value);
          } else if (key === "p-bind") {
            _this3.setAttributes(element, value);
          } else {
            value = key === "class" ? _toConsumableArray$3(new Set(computedStyles("class", value))).join(" ").trim() : key === "style" ? computedStyles("style", value).join(";").trim() : value;
            (element.$attrs = element.$attrs || {}) && (element.$attrs[key] = value);
            element.setAttribute(key, value);
          }
        }
      });
    }
  },
  getAttribute: function getAttribute(element, name) {
    if (this.isElement(element)) {
      var value = element.getAttribute(name);
      if (!isNaN(value)) {
        return +value;
      }
      if (value === "true" || value === "false") {
        return value === "true";
      }
      return value;
    }
    return void 0;
  },
  isAttributeEquals: function isAttributeEquals(element, name, value) {
    return this.isElement(element) ? this.getAttribute(element, name) === value : false;
  },
  isAttributeNotEquals: function isAttributeNotEquals(element, name, value) {
    return !this.isAttributeEquals(element, name, value);
  },
  getHeight: function getHeight(el) {
    if (el) {
      var height = el.offsetHeight;
      var style = getComputedStyle(el);
      height -= parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      return height;
    }
    return 0;
  },
  getWidth: function getWidth(el) {
    if (el) {
      var width2 = el.offsetWidth;
      var style = getComputedStyle(el);
      width2 -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
      return width2;
    }
    return 0;
  },
  absolutePosition: function absolutePosition(element, target) {
    var gutter = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    if (element) {
      var elementDimensions = element.offsetParent ? {
        width: element.offsetWidth,
        height: element.offsetHeight
      } : this.getHiddenElementDimensions(element);
      var elementOuterHeight = elementDimensions.height;
      var elementOuterWidth = elementDimensions.width;
      var targetOuterHeight = target.offsetHeight;
      var targetOuterWidth = target.offsetWidth;
      var targetOffset = target.getBoundingClientRect();
      var windowScrollTop = this.getWindowScrollTop();
      var windowScrollLeft = this.getWindowScrollLeft();
      var viewport = this.getViewport();
      var top, left, origin = "top";
      if (targetOffset.top + targetOuterHeight + elementOuterHeight > viewport.height) {
        top = targetOffset.top + windowScrollTop - elementOuterHeight;
        origin = "bottom";
        if (top < 0) {
          top = windowScrollTop;
        }
      } else {
        top = targetOuterHeight + targetOffset.top + windowScrollTop;
      }
      if (targetOffset.left + elementOuterWidth > viewport.width)
        left = Math.max(0, targetOffset.left + windowScrollLeft + targetOuterWidth - elementOuterWidth);
      else
        left = targetOffset.left + windowScrollLeft;
      element.style.top = top + "px";
      element.style.left = left + "px";
      element.style.transformOrigin = origin;
      gutter && (element.style.marginTop = origin === "bottom" ? "calc(var(--p-anchor-gutter) * -1)" : "calc(var(--p-anchor-gutter))");
    }
  },
  relativePosition: function relativePosition(element, target) {
    var gutter = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    if (element) {
      var elementDimensions = element.offsetParent ? {
        width: element.offsetWidth,
        height: element.offsetHeight
      } : this.getHiddenElementDimensions(element);
      var targetHeight = target.offsetHeight;
      var targetOffset = target.getBoundingClientRect();
      var viewport = this.getViewport();
      var top, left, origin = "top";
      if (targetOffset.top + targetHeight + elementDimensions.height > viewport.height) {
        top = -1 * elementDimensions.height;
        origin = "bottom";
        if (targetOffset.top + top < 0) {
          top = -1 * targetOffset.top;
        }
      } else {
        top = targetHeight;
      }
      if (elementDimensions.width > viewport.width) {
        left = targetOffset.left * -1;
      } else if (targetOffset.left + elementDimensions.width > viewport.width) {
        left = (targetOffset.left + elementDimensions.width - viewport.width) * -1;
      } else {
        left = 0;
      }
      element.style.top = top + "px";
      element.style.left = left + "px";
      element.style.transformOrigin = origin;
      gutter && (element.style.marginTop = origin === "bottom" ? "calc(var(--p-anchor-gutter) * -1)" : "calc(var(--p-anchor-gutter))");
    }
  },
  nestedPosition: function nestedPosition(element, level) {
    if (element) {
      var parentItem = element.parentElement;
      var elementOffset = this.getOffset(parentItem);
      var viewport = this.getViewport();
      var sublistWidth = element.offsetParent ? element.offsetWidth : this.getHiddenElementOuterWidth(element);
      var itemOuterWidth = this.getOuterWidth(parentItem.children[0]);
      var left;
      if (parseInt(elementOffset.left, 10) + itemOuterWidth + sublistWidth > viewport.width - this.calculateScrollbarWidth()) {
        if (parseInt(elementOffset.left, 10) < sublistWidth) {
          if (level % 2 === 1) {
            left = parseInt(elementOffset.left, 10) ? "-" + parseInt(elementOffset.left, 10) + "px" : "100%";
          } else if (level % 2 === 0) {
            left = viewport.width - sublistWidth - this.calculateScrollbarWidth() + "px";
          }
        } else {
          left = "-100%";
        }
      } else {
        left = "100%";
      }
      element.style.top = "0px";
      element.style.left = left;
    }
  },
  getParentNode: function getParentNode(element) {
    var parent = element === null || element === void 0 ? void 0 : element.parentNode;
    if (parent && parent instanceof ShadowRoot && parent.host) {
      parent = parent.host;
    }
    return parent;
  },
  getParents: function getParents(element) {
    var parents = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
    var parent = this.getParentNode(element);
    return parent === null ? parents : this.getParents(parent, parents.concat([parent]));
  },
  getScrollableParents: function getScrollableParents(element) {
    var scrollableParents = [];
    if (element) {
      var parents = this.getParents(element);
      var overflowRegex = /(auto|scroll)/;
      var overflowCheck = function overflowCheck2(node) {
        try {
          var styleDeclaration = (void 0)["getComputedStyle"](node, null);
          return overflowRegex.test(styleDeclaration.getPropertyValue("overflow")) || overflowRegex.test(styleDeclaration.getPropertyValue("overflowX")) || overflowRegex.test(styleDeclaration.getPropertyValue("overflowY"));
        } catch (err) {
          return false;
        }
      };
      var _iterator = _createForOfIteratorHelper$1(parents), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var parent = _step.value;
          var scrollSelectors = parent.nodeType === 1 && parent.dataset["scrollselectors"];
          if (scrollSelectors) {
            var selectors = scrollSelectors.split(",");
            var _iterator2 = _createForOfIteratorHelper$1(selectors), _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                var selector = _step2.value;
                var el = this.findSingle(parent, selector);
                if (el && overflowCheck(el)) {
                  scrollableParents.push(el);
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
          if (parent.nodeType !== 9 && overflowCheck(parent)) {
            scrollableParents.push(parent);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    return scrollableParents;
  },
  getHiddenElementOuterHeight: function getHiddenElementOuterHeight(element) {
    if (element) {
      element.style.visibility = "hidden";
      element.style.display = "block";
      var elementHeight = element.offsetHeight;
      element.style.display = "none";
      element.style.visibility = "visible";
      return elementHeight;
    }
    return 0;
  },
  getHiddenElementOuterWidth: function getHiddenElementOuterWidth(element) {
    if (element) {
      element.style.visibility = "hidden";
      element.style.display = "block";
      var elementWidth = element.offsetWidth;
      element.style.display = "none";
      element.style.visibility = "visible";
      return elementWidth;
    }
    return 0;
  },
  getHiddenElementDimensions: function getHiddenElementDimensions(element) {
    if (element) {
      var dimensions = {};
      element.style.visibility = "hidden";
      element.style.display = "block";
      dimensions.width = element.offsetWidth;
      dimensions.height = element.offsetHeight;
      element.style.display = "none";
      element.style.visibility = "visible";
      return dimensions;
    }
    return 0;
  },
  fadeIn: function fadeIn(element, duration) {
    if (element) {
      element.style.opacity = 0;
      var last = +/* @__PURE__ */ new Date();
      var opacity = 0;
      var tick = function tick2() {
        opacity = +element.style.opacity + ((/* @__PURE__ */ new Date()).getTime() - last) / duration;
        element.style.opacity = opacity;
        last = +/* @__PURE__ */ new Date();
        if (+opacity < 1) {
          (void 0).requestAnimationFrame && requestAnimationFrame(tick2) || setTimeout(tick2, 16);
        }
      };
      tick();
    }
  },
  fadeOut: function fadeOut(element, ms) {
    if (element) {
      var opacity = 1, interval = 50, duration = ms, gap = interval / duration;
      var fading = setInterval(function() {
        opacity -= gap;
        if (opacity <= 0) {
          opacity = 0;
          clearInterval(fading);
        }
        element.style.opacity = opacity;
      }, interval);
    }
  },
  getUserAgent: function getUserAgent() {
    return (void 0).userAgent;
  },
  appendChild: function appendChild(element, target) {
    if (this.isElement(target))
      target.appendChild(element);
    else if (target.el && target.elElement)
      target.elElement.appendChild(element);
    else
      throw new Error("Cannot append " + target + " to " + element);
  },
  isElement: function isElement(obj) {
    return (typeof HTMLElement === "undefined" ? "undefined" : _typeof$3$1(HTMLElement)) === "object" ? obj instanceof HTMLElement : obj && _typeof$3$1(obj) === "object" && obj !== null && obj.nodeType === 1 && typeof obj.nodeName === "string";
  },
  scrollInView: function scrollInView(container, item) {
    var borderTopValue = getComputedStyle(container).getPropertyValue("borderTopWidth");
    var borderTop = borderTopValue ? parseFloat(borderTopValue) : 0;
    var paddingTopValue = getComputedStyle(container).getPropertyValue("paddingTop");
    var paddingTop = paddingTopValue ? parseFloat(paddingTopValue) : 0;
    var containerRect = container.getBoundingClientRect();
    var itemRect = item.getBoundingClientRect();
    var offset = itemRect.top + (void 0).body.scrollTop - (containerRect.top + (void 0).body.scrollTop) - borderTop - paddingTop;
    var scroll = container.scrollTop;
    var elementHeight = container.clientHeight;
    var itemHeight = this.getOuterHeight(item);
    if (offset < 0) {
      container.scrollTop = scroll + offset;
    } else if (offset + itemHeight > elementHeight) {
      container.scrollTop = scroll + offset - elementHeight + itemHeight;
    }
  },
  clearSelection: function clearSelection() {
    if ((void 0).getSelection) {
      if ((void 0).getSelection().empty) {
        (void 0).getSelection().empty();
      } else if ((void 0).getSelection().removeAllRanges && (void 0).getSelection().rangeCount > 0 && (void 0).getSelection().getRangeAt(0).getClientRects().length > 0) {
        (void 0).getSelection().removeAllRanges();
      }
    } else if ((void 0)["selection"] && (void 0)["selection"].empty) {
      try {
        (void 0)["selection"].empty();
      } catch (error) {
      }
    }
  },
  getSelection: function getSelection() {
    if ((void 0).getSelection)
      return (void 0).getSelection().toString();
    else if ((void 0).getSelection)
      return (void 0).getSelection().toString();
    else if ((void 0)["selection"])
      return (void 0)["selection"].createRange().text;
    return null;
  },
  calculateScrollbarWidth: function calculateScrollbarWidth() {
    if (this.calculatedScrollbarWidth != null)
      return this.calculatedScrollbarWidth;
    var scrollDiv = (void 0).createElement("div");
    this.addStyles(scrollDiv, {
      width: "100px",
      height: "100px",
      overflow: "scroll",
      position: "absolute",
      top: "-9999px"
    });
    (void 0).body.appendChild(scrollDiv);
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    (void 0).body.removeChild(scrollDiv);
    this.calculatedScrollbarWidth = scrollbarWidth;
    return scrollbarWidth;
  },
  calculateBodyScrollbarWidth: function calculateBodyScrollbarWidth() {
    return (void 0).innerWidth - (void 0).documentElement.offsetWidth;
  },
  getBrowser: function getBrowser() {
    if (!this.browser) {
      var matched = this.resolveUserAgent();
      this.browser = {};
      if (matched.browser) {
        this.browser[matched.browser] = true;
        this.browser["version"] = matched.version;
      }
      if (this.browser["chrome"]) {
        this.browser["webkit"] = true;
      } else if (this.browser["webkit"]) {
        this.browser["safari"] = true;
      }
    }
    return this.browser;
  },
  resolveUserAgent: function resolveUserAgent() {
    var ua = (void 0).userAgent.toLowerCase();
    var match = /(chrome)[ ]([\w.]+)/.exec(ua) || /(webkit)[ ]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ ]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
    return {
      browser: match[1] || "",
      version: match[2] || "0"
    };
  },
  isVisible: function isVisible(element) {
    return element && element.offsetParent != null;
  },
  invokeElementMethod: function invokeElementMethod(element, methodName, args) {
    element[methodName].apply(element, args);
  },
  isExist: function isExist(element) {
    return !!(element !== null && typeof element !== "undefined" && element.nodeName && this.getParentNode(element));
  },
  isClient: function isClient() {
    return false;
  },
  focus: function focus(el, options) {
    el && (void 0).activeElement !== el && el.focus(options);
  },
  isFocusableElement: function isFocusableElement(element) {
    var selector = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    return this.isElement(element) ? element.matches('button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])'.concat(selector, ',\n                [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector)) : false;
  },
  getFocusableElements: function getFocusableElements(element) {
    var selector = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    var focusableElements = this.find(element, 'button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])'.concat(selector, ',\n                [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector, ',\n                [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])').concat(selector));
    var visibleFocusableElements = [];
    var _iterator3 = _createForOfIteratorHelper$1(focusableElements), _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
        var focusableElement = _step3.value;
        if (getComputedStyle(focusableElement).display != "none" && getComputedStyle(focusableElement).visibility != "hidden")
          visibleFocusableElements.push(focusableElement);
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
    return visibleFocusableElements;
  },
  getFirstFocusableElement: function getFirstFocusableElement(element, selector) {
    var focusableElements = this.getFocusableElements(element, selector);
    return focusableElements.length > 0 ? focusableElements[0] : null;
  },
  getLastFocusableElement: function getLastFocusableElement(element, selector) {
    var focusableElements = this.getFocusableElements(element, selector);
    return focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : null;
  },
  getNextFocusableElement: function getNextFocusableElement(container, element, selector) {
    var focusableElements = this.getFocusableElements(container, selector);
    var index2 = focusableElements.length > 0 ? focusableElements.findIndex(function(el) {
      return el === element;
    }) : -1;
    var nextIndex = index2 > -1 && focusableElements.length >= index2 + 1 ? index2 + 1 : -1;
    return nextIndex > -1 ? focusableElements[nextIndex] : null;
  },
  getPreviousElementSibling: function getPreviousElementSibling(element, selector) {
    var previousElement = element.previousElementSibling;
    while (previousElement) {
      if (previousElement.matches(selector)) {
        return previousElement;
      } else {
        previousElement = previousElement.previousElementSibling;
      }
    }
    return null;
  },
  getNextElementSibling: function getNextElementSibling(element, selector) {
    var nextElement = element.nextElementSibling;
    while (nextElement) {
      if (nextElement.matches(selector)) {
        return nextElement;
      } else {
        nextElement = nextElement.nextElementSibling;
      }
    }
    return null;
  },
  isClickable: function isClickable(element) {
    if (element) {
      var targetNode = element.nodeName;
      var parentNode = element.parentElement && element.parentElement.nodeName;
      return targetNode === "INPUT" || targetNode === "TEXTAREA" || targetNode === "BUTTON" || targetNode === "A" || parentNode === "INPUT" || parentNode === "TEXTAREA" || parentNode === "BUTTON" || parentNode === "A" || !!element.closest(".p-button, .p-checkbox, .p-radiobutton");
    }
    return false;
  },
  applyStyle: function applyStyle(element, style) {
    if (typeof style === "string") {
      element.style.cssText = style;
    } else {
      for (var prop in style) {
        element.style[prop] = style[prop];
      }
    }
  },
  isIOS: function isIOS() {
    return /iPad|iPhone|iPod/.test((void 0).userAgent) && !(void 0)["MSStream"];
  },
  isAndroid: function isAndroid() {
    return /(android)/i.test((void 0).userAgent);
  },
  isTouchDevice: function isTouchDevice() {
    return "ontouchstart" in void 0 || (void 0).maxTouchPoints > 0 || (void 0).msMaxTouchPoints > 0;
  },
  hasCSSAnimation: function hasCSSAnimation(element) {
    if (element) {
      var style = getComputedStyle(element);
      var animationDuration = parseFloat(style.getPropertyValue("animation-duration") || "0");
      return animationDuration > 0;
    }
    return false;
  },
  hasCSSTransition: function hasCSSTransition(element) {
    if (element) {
      var style = getComputedStyle(element);
      var transitionDuration = parseFloat(style.getPropertyValue("transition-duration") || "0");
      return transitionDuration > 0;
    }
    return false;
  },
  exportCSV: function exportCSV(csv, filename) {
    var blob = new Blob([csv], {
      type: "application/csv;charset=utf-8;"
    });
    if ((void 0).navigator.msSaveOrOpenBlob) {
      (void 0).msSaveOrOpenBlob(blob, filename + ".csv");
    } else {
      var link = (void 0).createElement("a");
      if (link.download !== void 0) {
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", filename + ".csv");
        link.style.display = "none";
        (void 0).body.appendChild(link);
        link.click();
        (void 0).body.removeChild(link);
      } else {
        csv = "data:text/csv;charset=utf-8," + csv;
        (void 0).open(encodeURI(csv));
      }
    }
  },
  blockBodyScroll: function blockBodyScroll() {
    var className = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "p-overflow-hidden";
    (void 0).body.style.setProperty("--scrollbar-width", this.calculateBodyScrollbarWidth() + "px");
    this.addClass((void 0).body, className);
  },
  unblockBodyScroll: function unblockBodyScroll() {
    var className = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "p-overflow-hidden";
    (void 0).body.style.removeProperty("--scrollbar-width");
    this.removeClass((void 0).body, className);
  }
};
function _typeof$2$1(o) {
  "@babel/helpers - typeof";
  return _typeof$2$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$2$1(o);
}
function _classCallCheck$1(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties$1(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey$1$1(descriptor.key), descriptor);
  }
}
function _createClass$1(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties$1(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties$1(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
function _toPropertyKey$1$1(t) {
  var i = _toPrimitive$1$1(t, "string");
  return "symbol" == _typeof$2$1(i) ? i : String(i);
}
function _toPrimitive$1$1(t, r) {
  if ("object" != _typeof$2$1(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$2$1(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var ConnectedOverlayScrollHandler = /* @__PURE__ */ function() {
  function ConnectedOverlayScrollHandler2(element) {
    var listener = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : function() {
    };
    _classCallCheck$1(this, ConnectedOverlayScrollHandler2);
    this.element = element;
    this.listener = listener;
  }
  _createClass$1(ConnectedOverlayScrollHandler2, [{
    key: "bindScrollListener",
    value: function bindScrollListener2() {
      this.scrollableParents = DomHandler.getScrollableParents(this.element);
      for (var i = 0; i < this.scrollableParents.length; i++) {
        this.scrollableParents[i].addEventListener("scroll", this.listener);
      }
    }
  }, {
    key: "unbindScrollListener",
    value: function unbindScrollListener2() {
      if (this.scrollableParents) {
        for (var i = 0; i < this.scrollableParents.length; i++) {
          this.scrollableParents[i].removeEventListener("scroll", this.listener);
        }
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.unbindScrollListener();
      this.element = null;
      this.listener = null;
      this.scrollableParents = null;
    }
  }]);
  return ConnectedOverlayScrollHandler2;
}();
function primebus() {
  var allHandlers = /* @__PURE__ */ new Map();
  return {
    on: function on(type, handler2) {
      var handlers = allHandlers.get(type);
      if (!handlers)
        handlers = [handler2];
      else
        handlers.push(handler2);
      allHandlers.set(type, handlers);
    },
    off: function off(type, handler2) {
      var handlers = allHandlers.get(type);
      if (handlers) {
        handlers.splice(handlers.indexOf(handler2) >>> 0, 1);
      }
    },
    emit: function emit(type, evt) {
      var handlers = allHandlers.get(type);
      if (handlers) {
        handlers.slice().map(function(handler2) {
          handler2(evt);
        });
      }
    }
  };
}
function _slicedToArray$4(arr, i) {
  return _arrayWithHoles$4(arr) || _iterableToArrayLimit$4(arr, i) || _unsupportedIterableToArray$2$1(arr, i) || _nonIterableRest$4();
}
function _nonIterableRest$4() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _iterableToArrayLimit$4(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t)
          return;
        f = false;
      } else
        for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true)
          ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u))
          return;
      } finally {
        if (o)
          throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$4(arr) {
  if (Array.isArray(arr))
    return arr;
}
function _toConsumableArray$2(arr) {
  return _arrayWithoutHoles$2(arr) || _iterableToArray$2(arr) || _unsupportedIterableToArray$2$1(arr) || _nonIterableSpread$2();
}
function _nonIterableSpread$2() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _iterableToArray$2(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _arrayWithoutHoles$2(arr) {
  if (Array.isArray(arr))
    return _arrayLikeToArray$2$1(arr);
}
function _createForOfIteratorHelper$2(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray$2$1(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it)
        o = it;
      var i = 0;
      var F = function F2() {
      };
      return { s: F, n: function n() {
        if (i >= o.length)
          return { done: true };
        return { done: false, value: o[i++] };
      }, e: function e(_e) {
        throw _e;
      }, f: F };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true, didErr = false, err;
  return { s: function s() {
    it = it.call(o);
  }, n: function n() {
    var step = it.next();
    normalCompletion = step.done;
    return step;
  }, e: function e(_e2) {
    didErr = true;
    err = _e2;
  }, f: function f() {
    try {
      if (!normalCompletion && it["return"] != null)
        it["return"]();
    } finally {
      if (didErr)
        throw err;
    }
  } };
}
function _unsupportedIterableToArray$2$1(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$2$1(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$2$1(o, minLen);
}
function _arrayLikeToArray$2$1(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _typeof$1$1(o) {
  "@babel/helpers - typeof";
  return _typeof$1$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$1$1(o);
}
var ObjectUtils = {
  equals: function equals(obj1, obj2, field) {
    if (field)
      return this.resolveFieldData(obj1, field) === this.resolveFieldData(obj2, field);
    else
      return this.deepEquals(obj1, obj2);
  },
  deepEquals: function deepEquals(a, b) {
    if (a === b)
      return true;
    if (a && b && _typeof$1$1(a) == "object" && _typeof$1$1(b) == "object") {
      var arrA = Array.isArray(a), arrB = Array.isArray(b), i, length, key;
      if (arrA && arrB) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length; i-- !== 0; )
          if (!this.deepEquals(a[i], b[i]))
            return false;
        return true;
      }
      if (arrA != arrB)
        return false;
      var dateA = a instanceof Date, dateB = b instanceof Date;
      if (dateA != dateB)
        return false;
      if (dateA && dateB)
        return a.getTime() == b.getTime();
      var regexpA = a instanceof RegExp, regexpB = b instanceof RegExp;
      if (regexpA != regexpB)
        return false;
      if (regexpA && regexpB)
        return a.toString() == b.toString();
      var keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length; i-- !== 0; ) {
        key = keys[i];
        if (!this.deepEquals(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  },
  resolveFieldData: function resolveFieldData(data, field) {
    if (!data || !field) {
      return null;
    }
    try {
      var value = data[field];
      if (this.isNotEmpty(value))
        return value;
    } catch (_unused) {
    }
    if (Object.keys(data).length) {
      if (this.isFunction(field)) {
        return field(data);
      } else if (field.indexOf(".") === -1) {
        return data[field];
      } else {
        var fields = field.split(".");
        var _value = data;
        for (var i = 0, len = fields.length; i < len; ++i) {
          if (_value == null) {
            return null;
          }
          _value = _value[fields[i]];
        }
        return _value;
      }
    }
    return null;
  },
  getItemValue: function getItemValue(obj) {
    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }
    return this.isFunction(obj) ? obj.apply(void 0, params) : obj;
  },
  filter: function filter(value, fields, filterValue) {
    var filteredItems = [];
    if (value) {
      var _iterator = _createForOfIteratorHelper$2(value), _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var item = _step.value;
          var _iterator2 = _createForOfIteratorHelper$2(fields), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var field = _step2.value;
              if (String(this.resolveFieldData(item, field)).toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
                filteredItems.push(item);
                break;
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
    return filteredItems;
  },
  reorderArray: function reorderArray(value, from, to) {
    if (value && from !== to) {
      if (to >= value.length) {
        to %= value.length;
        from %= value.length;
      }
      value.splice(to, 0, value.splice(from, 1)[0]);
    }
  },
  findIndexInList: function findIndexInList(value, list) {
    var index2 = -1;
    if (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i] === value) {
          index2 = i;
          break;
        }
      }
    }
    return index2;
  },
  contains: function contains(value, list) {
    if (value != null && list && list.length) {
      var _iterator3 = _createForOfIteratorHelper$2(list), _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
          var val = _step3.value;
          if (this.equals(value, val))
            return true;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    return false;
  },
  insertIntoOrderedArray: function insertIntoOrderedArray(item, index2, arr, sourceArr) {
    if (arr.length > 0) {
      var injected = false;
      for (var i = 0; i < arr.length; i++) {
        var currentItemIndex = this.findIndexInList(arr[i], sourceArr);
        if (currentItemIndex > index2) {
          arr.splice(i, 0, item);
          injected = true;
          break;
        }
      }
      if (!injected) {
        arr.push(item);
      }
    } else {
      arr.push(item);
    }
  },
  removeAccents: function removeAccents(str) {
    if (str && str.search(/[\xC0-\xFF]/g) > -1) {
      str = str.replace(/[\xC0-\xC5]/g, "A").replace(/[\xC6]/g, "AE").replace(/[\xC7]/g, "C").replace(/[\xC8-\xCB]/g, "E").replace(/[\xCC-\xCF]/g, "I").replace(/[\xD0]/g, "D").replace(/[\xD1]/g, "N").replace(/[\xD2-\xD6\xD8]/g, "O").replace(/[\xD9-\xDC]/g, "U").replace(/[\xDD]/g, "Y").replace(/[\xDE]/g, "P").replace(/[\xE0-\xE5]/g, "a").replace(/[\xE6]/g, "ae").replace(/[\xE7]/g, "c").replace(/[\xE8-\xEB]/g, "e").replace(/[\xEC-\xEF]/g, "i").replace(/[\xF1]/g, "n").replace(/[\xF2-\xF6\xF8]/g, "o").replace(/[\xF9-\xFC]/g, "u").replace(/[\xFE]/g, "p").replace(/[\xFD\xFF]/g, "y");
    }
    return str;
  },
  getVNodeProp: function getVNodeProp(vnode, prop) {
    if (vnode) {
      var props = vnode.props;
      if (props) {
        var kebabProp = prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        var propName = Object.prototype.hasOwnProperty.call(props, kebabProp) ? kebabProp : prop;
        return vnode.type["extends"].props[prop].type === Boolean && props[propName] === "" ? true : props[propName];
      }
    }
    return null;
  },
  toFlatCase: function toFlatCase(str) {
    return this.isString(str) ? str.replace(/(-|_)/g, "").toLowerCase() : str;
  },
  toKebabCase: function toKebabCase(str) {
    return this.isString(str) ? str.replace(/(_)/g, "-").replace(/[A-Z]/g, function(c, i) {
      return i === 0 ? c : "-" + c.toLowerCase();
    }).toLowerCase() : str;
  },
  toCapitalCase: function toCapitalCase(str) {
    return this.isString(str, {
      empty: false
    }) ? str[0].toUpperCase() + str.slice(1) : str;
  },
  isEmpty: function isEmpty(value) {
    return value === null || value === void 0 || value === "" || Array.isArray(value) && value.length === 0 || !(value instanceof Date) && _typeof$1$1(value) === "object" && Object.keys(value).length === 0;
  },
  isNotEmpty: function isNotEmpty(value) {
    return !this.isEmpty(value);
  },
  isFunction: function isFunction(value) {
    return !!(value && value.constructor && value.call && value.apply);
  },
  isObject: function isObject(value) {
    var empty = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    return value instanceof Object && value.constructor === Object && (empty || Object.keys(value).length !== 0);
  },
  isDate: function isDate(value) {
    return value instanceof Date && value.constructor === Date;
  },
  isArray: function isArray(value) {
    var empty = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    return Array.isArray(value) && (empty || value.length !== 0);
  },
  isString: function isString(value) {
    var empty = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    return typeof value === "string" && (empty || value !== "");
  },
  isPrintableCharacter: function isPrintableCharacter() {
    var _char = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
    return this.isNotEmpty(_char) && _char.length === 1 && _char.match(/\S| /);
  },
  /**
   * Firefox-v103 does not currently support the "findLast" method. It is stated that this method will be supported with Firefox-v104.
   * https://caniuse.com/mdn-javascript_builtins_array_findlast
   */
  findLast: function findLast(arr, callback) {
    var item;
    if (this.isNotEmpty(arr)) {
      try {
        item = arr.findLast(callback);
      } catch (_unused2) {
        item = _toConsumableArray$2(arr).reverse().find(callback);
      }
    }
    return item;
  },
  /**
   * Firefox-v103 does not currently support the "findLastIndex" method. It is stated that this method will be supported with Firefox-v104.
   * https://caniuse.com/mdn-javascript_builtins_array_findlastindex
   */
  findLastIndex: function findLastIndex(arr, callback) {
    var index2 = -1;
    if (this.isNotEmpty(arr)) {
      try {
        index2 = arr.findLastIndex(callback);
      } catch (_unused3) {
        index2 = arr.lastIndexOf(_toConsumableArray$2(arr).reverse().find(callback));
      }
    }
    return index2;
  },
  sort: function sort(value1, value2) {
    var order = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
    var comparator = arguments.length > 3 ? arguments[3] : void 0;
    var nullSortOrder = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 1;
    var result = this.compare(value1, value2, comparator, order);
    var finalSortOrder = order;
    if (this.isEmpty(value1) || this.isEmpty(value2)) {
      finalSortOrder = nullSortOrder === 1 ? order : nullSortOrder;
    }
    return finalSortOrder * result;
  },
  compare: function compare(value1, value2, comparator) {
    var order = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 1;
    var result = -1;
    var emptyValue1 = this.isEmpty(value1);
    var emptyValue2 = this.isEmpty(value2);
    if (emptyValue1 && emptyValue2)
      result = 0;
    else if (emptyValue1)
      result = order;
    else if (emptyValue2)
      result = -order;
    else if (typeof value1 === "string" && typeof value2 === "string")
      result = comparator(value1, value2);
    else
      result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
    return result;
  },
  localeComparator: function localeComparator() {
    return new Intl.Collator(void 0, {
      numeric: true
    }).compare;
  },
  nestedKeys: function nestedKeys() {
    var _this = this;
    var obj = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var parentKey = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    return Object.entries(obj).reduce(function(o, _ref) {
      var _ref2 = _slicedToArray$4(_ref, 2), key = _ref2[0], value = _ref2[1];
      var currentKey = parentKey ? "".concat(parentKey, ".").concat(key) : key;
      _this.isObject(value) ? o = o.concat(_this.nestedKeys(value, currentKey)) : o.push(currentKey);
      return o;
    }, []);
  },
  stringify: function stringify(value) {
    var _this2 = this;
    var indent = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 2;
    var currentIndent = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    var currentIndentStr = " ".repeat(currentIndent);
    var nextIndentStr = " ".repeat(currentIndent + indent);
    if (this.isArray(value)) {
      return "[" + value.map(function(v) {
        return _this2.stringify(v, indent, currentIndent + indent);
      }).join(", ") + "]";
    } else if (this.isDate(value)) {
      return value.toISOString();
    } else if (this.isFunction(value)) {
      return value.toString();
    } else if (this.isObject(value)) {
      return "{\n" + Object.entries(value).map(function(_ref3) {
        var _ref4 = _slicedToArray$4(_ref3, 2), k = _ref4[0], v = _ref4[1];
        return "".concat(nextIndentStr).concat(k, ": ").concat(_this2.stringify(v, indent, currentIndent + indent));
      }).join(",\n") + "\n".concat(currentIndentStr) + "}";
    } else {
      return JSON.stringify(value);
    }
  }
};
function _typeof$8(o) {
  "@babel/helpers - typeof";
  return _typeof$8 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$8(o);
}
function _toConsumableArray$1(arr) {
  return _arrayWithoutHoles$1(arr) || _iterableToArray$1(arr) || _unsupportedIterableToArray$1$1(arr) || _nonIterableSpread$1();
}
function _nonIterableSpread$1() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$1$1(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$1$1(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$1$1(o, minLen);
}
function _iterableToArray$1(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _arrayWithoutHoles$1(arr) {
  if (Array.isArray(arr))
    return _arrayLikeToArray$1$1(arr);
}
function _arrayLikeToArray$1$1(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey$7(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
function _defineProperty$7(obj, key, value) {
  key = _toPropertyKey$7(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$7(t) {
  var i = _toPrimitive$7(t, "string");
  return "symbol" == _typeof$8(i) ? i : String(i);
}
function _toPrimitive$7(t, r) {
  if ("object" != _typeof$8(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$8(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var _default = /* @__PURE__ */ function() {
  function _default2(_ref) {
    var init = _ref.init, type = _ref.type;
    _classCallCheck(this, _default2);
    _defineProperty$7(this, "helpers", void 0);
    _defineProperty$7(this, "type", void 0);
    this.helpers = new Set(init);
    this.type = type;
  }
  _createClass(_default2, [{
    key: "add",
    value: function add(instance) {
      this.helpers.add(instance);
    }
  }, {
    key: "update",
    value: function update() {
    }
  }, {
    key: "delete",
    value: function _delete(instance) {
      this.helpers["delete"](instance);
    }
  }, {
    key: "clear",
    value: function clear() {
      this.helpers.clear();
    }
  }, {
    key: "get",
    value: function get(parentInstance, slots) {
      var children = this._get(parentInstance, slots);
      var computed2 = children ? this._recursive(_toConsumableArray$1(this.helpers), children) : null;
      return ObjectUtils.isNotEmpty(computed2) ? computed2 : null;
    }
  }, {
    key: "_isMatched",
    value: function _isMatched(instance, key) {
      var _parent$vnode;
      var parent = instance === null || instance === void 0 ? void 0 : instance.parent;
      return (parent === null || parent === void 0 || (_parent$vnode = parent.vnode) === null || _parent$vnode === void 0 ? void 0 : _parent$vnode.key) === key || parent && this._isMatched(parent, key) || false;
    }
  }, {
    key: "_get",
    value: function _get(parentInstance, slots) {
      var _ref2, _ref2$default;
      return ((_ref2 = slots || (parentInstance === null || parentInstance === void 0 ? void 0 : parentInstance.$slots)) === null || _ref2 === void 0 || (_ref2$default = _ref2["default"]) === null || _ref2$default === void 0 ? void 0 : _ref2$default.call(_ref2)) || null;
    }
  }, {
    key: "_recursive",
    value: function _recursive() {
      var _this = this;
      var helpers = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
      var children = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
      var components = [];
      children.forEach(function(child) {
        if (child.children instanceof Array) {
          components = components.concat(_this._recursive(components, child.children));
        } else if (child.type.name === _this.type) {
          components.push(child);
        } else if (ObjectUtils.isNotEmpty(child.key)) {
          components = components.concat(helpers.filter(function(c) {
            return _this._isMatched(c, child.key);
          }).map(function(c) {
            return c.vnode;
          }));
        }
      });
      return components;
    }
  }]);
  return _default2;
}();
var lastId = 0;
function UniqueComponentId() {
  var prefix = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "pv_id_";
  lastId++;
  return "".concat(prefix).concat(lastId);
}
function _toConsumableArray$4(arr) {
  return _arrayWithoutHoles$4(arr) || _iterableToArray$4(arr) || _unsupportedIterableToArray$6(arr) || _nonIterableSpread$4();
}
function _nonIterableSpread$4() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$6(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$6(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$6(o, minLen);
}
function _iterableToArray$4(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _arrayWithoutHoles$4(arr) {
  if (Array.isArray(arr))
    return _arrayLikeToArray$6(arr);
}
function _arrayLikeToArray$6(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function handler() {
  var zIndexes = [];
  var generateZIndex = function generateZIndex2(key, autoZIndex) {
    var baseZIndex = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 999;
    var lastZIndex = getLastZIndex(key, autoZIndex, baseZIndex);
    var newZIndex = lastZIndex.value + (lastZIndex.key === key ? 0 : baseZIndex) + 1;
    zIndexes.push({
      key,
      value: newZIndex
    });
    return newZIndex;
  };
  var revertZIndex = function revertZIndex2(zIndex) {
    zIndexes = zIndexes.filter(function(obj) {
      return obj.value !== zIndex;
    });
  };
  var getCurrentZIndex = function getCurrentZIndex2(key, autoZIndex) {
    return getLastZIndex(key, autoZIndex).value;
  };
  var getLastZIndex = function getLastZIndex2(key, autoZIndex) {
    var baseZIndex = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    return _toConsumableArray$4(zIndexes).reverse().find(function(obj) {
      return autoZIndex ? true : obj.key === key;
    }) || {
      key,
      value: baseZIndex
    };
  };
  var getZIndex = function getZIndex2(el) {
    return el ? parseInt(el.style.zIndex, 10) || 0 : 0;
  };
  return {
    get: getZIndex,
    set: function set(key, el, baseZIndex) {
      if (el) {
        el.style.zIndex = String(generateZIndex(key, true, baseZIndex));
      }
    },
    clear: function clear(el) {
      if (el) {
        revertZIndex(getZIndex(el));
        el.style.zIndex = "";
      }
    },
    getCurrent: function getCurrent(key) {
      return getCurrentZIndex(key, true);
    }
  };
}
var ZIndexUtils = handler();
var FilterMatchMode = {
  STARTS_WITH: "startsWith",
  CONTAINS: "contains",
  NOT_CONTAINS: "notContains",
  ENDS_WITH: "endsWith",
  EQUALS: "equals",
  NOT_EQUALS: "notEquals",
  IN: "in",
  LESS_THAN: "lt",
  LESS_THAN_OR_EQUAL_TO: "lte",
  GREATER_THAN: "gt",
  GREATER_THAN_OR_EQUAL_TO: "gte",
  BETWEEN: "between",
  DATE_IS: "dateIs",
  DATE_IS_NOT: "dateIsNot",
  DATE_BEFORE: "dateBefore",
  DATE_AFTER: "dateAfter"
};
var FilterOperator = {
  AND: "and",
  OR: "or"
};
function _createForOfIteratorHelper(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray$5(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it)
        o = it;
      var i = 0;
      var F = function F2() {
      };
      return { s: F, n: function n() {
        if (i >= o.length)
          return { done: true };
        return { done: false, value: o[i++] };
      }, e: function e(_e) {
        throw _e;
      }, f: F };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true, didErr = false, err;
  return { s: function s() {
    it = it.call(o);
  }, n: function n() {
    var step = it.next();
    normalCompletion = step.done;
    return step;
  }, e: function e(_e2) {
    didErr = true;
    err = _e2;
  }, f: function f() {
    try {
      if (!normalCompletion && it["return"] != null)
        it["return"]();
    } finally {
      if (didErr)
        throw err;
    }
  } };
}
function _unsupportedIterableToArray$5(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$5(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$5(o, minLen);
}
function _arrayLikeToArray$5(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
var FilterService = {
  filter: function filter2(value, fields, filterValue, filterMatchMode, filterLocale) {
    var filteredItems = [];
    if (!value) {
      return filteredItems;
    }
    var _iterator = _createForOfIteratorHelper(value), _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done; ) {
        var item = _step.value;
        if (typeof item === "string") {
          if (this.filters[filterMatchMode](item, filterValue, filterLocale)) {
            filteredItems.push(item);
            continue;
          }
        } else {
          var _iterator2 = _createForOfIteratorHelper(fields), _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
              var field = _step2.value;
              var fieldValue = ObjectUtils.resolveFieldData(item, field);
              if (this.filters[filterMatchMode](fieldValue, filterValue, filterLocale)) {
                filteredItems.push(item);
                break;
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return filteredItems;
  },
  filters: {
    startsWith: function startsWith(value, filter22, filterLocale) {
      if (filter22 === void 0 || filter22 === null || filter22 === "") {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      var filterValue = ObjectUtils.removeAccents(filter22.toString()).toLocaleLowerCase(filterLocale);
      var stringValue = ObjectUtils.removeAccents(value.toString()).toLocaleLowerCase(filterLocale);
      return stringValue.slice(0, filterValue.length) === filterValue;
    },
    contains: function contains2(value, filter22, filterLocale) {
      if (filter22 === void 0 || filter22 === null || filter22 === "") {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      var filterValue = ObjectUtils.removeAccents(filter22.toString()).toLocaleLowerCase(filterLocale);
      var stringValue = ObjectUtils.removeAccents(value.toString()).toLocaleLowerCase(filterLocale);
      return stringValue.indexOf(filterValue) !== -1;
    },
    notContains: function notContains(value, filter22, filterLocale) {
      if (filter22 === void 0 || filter22 === null || filter22 === "") {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      var filterValue = ObjectUtils.removeAccents(filter22.toString()).toLocaleLowerCase(filterLocale);
      var stringValue = ObjectUtils.removeAccents(value.toString()).toLocaleLowerCase(filterLocale);
      return stringValue.indexOf(filterValue) === -1;
    },
    endsWith: function endsWith(value, filter22, filterLocale) {
      if (filter22 === void 0 || filter22 === null || filter22 === "") {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      var filterValue = ObjectUtils.removeAccents(filter22.toString()).toLocaleLowerCase(filterLocale);
      var stringValue = ObjectUtils.removeAccents(value.toString()).toLocaleLowerCase(filterLocale);
      return stringValue.indexOf(filterValue, stringValue.length - filterValue.length) !== -1;
    },
    equals: function equals2(value, filter22, filterLocale) {
      if (filter22 === void 0 || filter22 === null || filter22 === "") {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      if (value.getTime && filter22.getTime)
        return value.getTime() === filter22.getTime();
      else
        return ObjectUtils.removeAccents(value.toString()).toLocaleLowerCase(filterLocale) == ObjectUtils.removeAccents(filter22.toString()).toLocaleLowerCase(filterLocale);
    },
    notEquals: function notEquals(value, filter22, filterLocale) {
      if (filter22 === void 0 || filter22 === null || filter22 === "") {
        return false;
      }
      if (value === void 0 || value === null) {
        return true;
      }
      if (value.getTime && filter22.getTime)
        return value.getTime() !== filter22.getTime();
      else
        return ObjectUtils.removeAccents(value.toString()).toLocaleLowerCase(filterLocale) != ObjectUtils.removeAccents(filter22.toString()).toLocaleLowerCase(filterLocale);
    },
    "in": function _in(value, filter22) {
      if (filter22 === void 0 || filter22 === null || filter22.length === 0) {
        return true;
      }
      for (var i = 0; i < filter22.length; i++) {
        if (ObjectUtils.equals(value, filter22[i])) {
          return true;
        }
      }
      return false;
    },
    between: function between(value, filter22) {
      if (filter22 == null || filter22[0] == null || filter22[1] == null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      if (value.getTime)
        return filter22[0].getTime() <= value.getTime() && value.getTime() <= filter22[1].getTime();
      else
        return filter22[0] <= value && value <= filter22[1];
    },
    lt: function lt(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      if (value.getTime && filter22.getTime)
        return value.getTime() < filter22.getTime();
      else
        return value < filter22;
    },
    lte: function lte(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      if (value.getTime && filter22.getTime)
        return value.getTime() <= filter22.getTime();
      else
        return value <= filter22;
    },
    gt: function gt(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      if (value.getTime && filter22.getTime)
        return value.getTime() > filter22.getTime();
      else
        return value > filter22;
    },
    gte: function gte(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      if (value.getTime && filter22.getTime)
        return value.getTime() >= filter22.getTime();
      else
        return value >= filter22;
    },
    dateIs: function dateIs(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      return value.toDateString() === filter22.toDateString();
    },
    dateIsNot: function dateIsNot(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      return value.toDateString() !== filter22.toDateString();
    },
    dateBefore: function dateBefore(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      return value.getTime() < filter22.getTime();
    },
    dateAfter: function dateAfter(value, filter22) {
      if (filter22 === void 0 || filter22 === null) {
        return true;
      }
      if (value === void 0 || value === null) {
        return false;
      }
      return value.getTime() > filter22.getTime();
    }
  },
  register: function register(rule, fn) {
    this.filters[rule] = fn;
  }
};
function _typeof$7(o) {
  "@babel/helpers - typeof";
  return _typeof$7 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$7(o);
}
function ownKeys$6(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$6(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$6(Object(t), true).forEach(function(r2) {
      _defineProperty$6(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$6(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$6(obj, key, value) {
  key = _toPropertyKey$6(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$6(t) {
  var i = _toPrimitive$6(t, "string");
  return "symbol" == _typeof$7(i) ? i : String(i);
}
function _toPrimitive$6(t, r) {
  if ("object" != _typeof$7(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$7(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var defaultOptions = {
  ripple: false,
  inputStyle: null,
  locale: {
    startsWith: "Starts with",
    contains: "Contains",
    notContains: "Not contains",
    endsWith: "Ends with",
    equals: "Equals",
    notEquals: "Not equals",
    noFilter: "No Filter",
    lt: "Less than",
    lte: "Less than or equal to",
    gt: "Greater than",
    gte: "Greater than or equal to",
    dateIs: "Date is",
    dateIsNot: "Date is not",
    dateBefore: "Date is before",
    dateAfter: "Date is after",
    clear: "Clear",
    apply: "Apply",
    matchAll: "Match All",
    matchAny: "Match Any",
    addRule: "Add Rule",
    removeRule: "Remove Rule",
    accept: "Yes",
    reject: "No",
    choose: "Choose",
    upload: "Upload",
    cancel: "Cancel",
    completed: "Completed",
    pending: "Pending",
    fileSizeTypes: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    chooseYear: "Choose Year",
    chooseMonth: "Choose Month",
    chooseDate: "Choose Date",
    prevDecade: "Previous Decade",
    nextDecade: "Next Decade",
    prevYear: "Previous Year",
    nextYear: "Next Year",
    prevMonth: "Previous Month",
    nextMonth: "Next Month",
    prevHour: "Previous Hour",
    nextHour: "Next Hour",
    prevMinute: "Previous Minute",
    nextMinute: "Next Minute",
    prevSecond: "Previous Second",
    nextSecond: "Next Second",
    am: "am",
    pm: "pm",
    today: "Today",
    weekHeader: "Wk",
    firstDayOfWeek: 0,
    showMonthAfterYear: false,
    dateFormat: "mm/dd/yy",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    passwordPrompt: "Enter a password",
    emptyFilterMessage: "No results found",
    // @deprecated Use 'emptySearchMessage' option instead.
    searchMessage: "{0} results are available",
    selectionMessage: "{0} items selected",
    emptySelectionMessage: "No selected item",
    emptySearchMessage: "No results found",
    emptyMessage: "No available options",
    aria: {
      trueLabel: "True",
      falseLabel: "False",
      nullLabel: "Not Selected",
      star: "1 star",
      stars: "{star} stars",
      selectAll: "All items selected",
      unselectAll: "All items unselected",
      close: "Close",
      previous: "Previous",
      next: "Next",
      navigation: "Navigation",
      scrollTop: "Scroll Top",
      moveTop: "Move Top",
      moveUp: "Move Up",
      moveDown: "Move Down",
      moveBottom: "Move Bottom",
      moveToTarget: "Move to Target",
      moveToSource: "Move to Source",
      moveAllToTarget: "Move All to Target",
      moveAllToSource: "Move All to Source",
      pageLabel: "Page {page}",
      firstPageLabel: "First Page",
      lastPageLabel: "Last Page",
      nextPageLabel: "Next Page",
      prevPageLabel: "Previous Page",
      rowsPerPageLabel: "Rows per page",
      jumpToPageDropdownLabel: "Jump to Page Dropdown",
      jumpToPageInputLabel: "Jump to Page Input",
      selectRow: "Row Selected",
      unselectRow: "Row Unselected",
      expandRow: "Row Expanded",
      collapseRow: "Row Collapsed",
      showFilterMenu: "Show Filter Menu",
      hideFilterMenu: "Hide Filter Menu",
      filterOperator: "Filter Operator",
      filterConstraint: "Filter Constraint",
      editRow: "Row Edit",
      saveEdit: "Save Edit",
      cancelEdit: "Cancel Edit",
      listView: "List View",
      gridView: "Grid View",
      slide: "Slide",
      slideNumber: "{slideNumber}",
      zoomImage: "Zoom Image",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      rotateRight: "Rotate Right",
      rotateLeft: "Rotate Left"
    }
  },
  filterMatchModeOptions: {
    text: [FilterMatchMode.STARTS_WITH, FilterMatchMode.CONTAINS, FilterMatchMode.NOT_CONTAINS, FilterMatchMode.ENDS_WITH, FilterMatchMode.EQUALS, FilterMatchMode.NOT_EQUALS],
    numeric: [FilterMatchMode.EQUALS, FilterMatchMode.NOT_EQUALS, FilterMatchMode.LESS_THAN, FilterMatchMode.LESS_THAN_OR_EQUAL_TO, FilterMatchMode.GREATER_THAN, FilterMatchMode.GREATER_THAN_OR_EQUAL_TO],
    date: [FilterMatchMode.DATE_IS, FilterMatchMode.DATE_IS_NOT, FilterMatchMode.DATE_BEFORE, FilterMatchMode.DATE_AFTER]
  },
  zIndex: {
    modal: 1100,
    overlay: 1e3,
    menu: 1e3,
    tooltip: 1100
  },
  pt: void 0,
  ptOptions: {
    mergeSections: true,
    mergeProps: false
  },
  unstyled: false,
  csp: {
    nonce: void 0
  }
};
var PrimeVueSymbol = Symbol();
function switchTheme(currentTheme, newTheme, linkElementId, callback) {
  if (currentTheme !== newTheme) {
    var linkElement = (void 0).getElementById(linkElementId);
    var cloneLinkElement = linkElement.cloneNode(true);
    var newThemeUrl = linkElement.getAttribute("href").replace(currentTheme, newTheme);
    cloneLinkElement.setAttribute("id", linkElementId + "-clone");
    cloneLinkElement.setAttribute("href", newThemeUrl);
    cloneLinkElement.addEventListener("load", function() {
      linkElement.remove();
      cloneLinkElement.setAttribute("id", linkElementId);
      if (callback) {
        callback();
      }
    });
    linkElement.parentNode && linkElement.parentNode.insertBefore(cloneLinkElement, linkElement.nextSibling);
  }
}
var PrimeVue = {
  install: function install(app, options) {
    var configOptions = options ? _objectSpread$6(_objectSpread$6({}, defaultOptions), options) : _objectSpread$6({}, defaultOptions);
    var PrimeVue2 = {
      config: reactive(configOptions),
      changeTheme: switchTheme
    };
    app.config.globalProperties.$primevue = PrimeVue2;
    app.provide(PrimeVueSymbol, PrimeVue2);
  }
};
var ConfirmationEventBus = primebus();
var PrimeVueConfirmSymbol = Symbol();
var ConfirmationService = {
  install: function install2(app) {
    var ConfirmationService2 = {
      require: function require2(options) {
        ConfirmationEventBus.emit("confirm", options);
      },
      close: function close() {
        ConfirmationEventBus.emit("close");
      }
    };
    app.config.globalProperties.$confirm = ConfirmationService2;
    app.provide(PrimeVueConfirmSymbol, ConfirmationService2);
  }
};
var DynamicDialogEventBus = primebus();
var PrimeVueDialogSymbol = Symbol();
var DialogService = {
  install: function install3(app) {
    var DialogService2 = {
      open: function open(content, options) {
        var instance = {
          content: content && markRaw(content),
          options: options || {},
          data: options && options.data,
          close: function close(params) {
            DynamicDialogEventBus.emit("close", {
              instance,
              params
            });
          }
        };
        DynamicDialogEventBus.emit("open", {
          instance
        });
        return instance;
      }
    };
    app.config.globalProperties.$dialog = DialogService2;
    app.provide(PrimeVueDialogSymbol, DialogService2);
  }
};
var ToastEventBus = primebus();
var PrimeVueToastSymbol = Symbol();
var ToastService = {
  install: function install4(app) {
    var ToastService2 = {
      add: function add(message2) {
        ToastEventBus.emit("add", message2);
      },
      remove: function remove3(message2) {
        ToastEventBus.emit("remove", message2);
      },
      removeGroup: function removeGroup(group) {
        ToastEventBus.emit("remove-group", group);
      },
      removeAllGroups: function removeAllGroups() {
        ToastEventBus.emit("remove-all-groups");
      }
    };
    app.config.globalProperties.$toast = ToastService2;
    app.provide(PrimeVueToastSymbol, ToastService2);
  }
};
function _typeof$6(o) {
  "@babel/helpers - typeof";
  return _typeof$6 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$6(o);
}
function ownKeys$5(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$5(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$5(Object(t), true).forEach(function(r2) {
      _defineProperty$5(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$5(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$5(obj, key, value) {
  key = _toPropertyKey$5(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$5(t) {
  var i = _toPrimitive$5(t, "string");
  return "symbol" == _typeof$6(i) ? i : String(i);
}
function _toPrimitive$5(t, r) {
  if ("object" != _typeof$6(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$6(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function tryOnMounted(fn) {
  var sync = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
  if (getCurrentInstance())
    ;
  else if (sync)
    fn();
  else
    nextTick(fn);
}
var _id = 0;
function useStyle(css2) {
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var isLoaded = ref(false);
  var cssRef = ref(css2);
  var styleRef = ref(null);
  var defaultDocument = DomHandler.isClient() ? (void 0).document : void 0;
  var _options$document = options.document, document = _options$document === void 0 ? defaultDocument : _options$document, _options$immediate = options.immediate, immediate = _options$immediate === void 0 ? true : _options$immediate, _options$manual = options.manual, manual = _options$manual === void 0 ? false : _options$manual, _options$name = options.name, name = _options$name === void 0 ? "style_".concat(++_id) : _options$name, _options$id = options.id, id = _options$id === void 0 ? void 0 : _options$id, _options$media = options.media, media = _options$media === void 0 ? void 0 : _options$media, _options$nonce = options.nonce, nonce = _options$nonce === void 0 ? void 0 : _options$nonce, _options$props = options.props, props = _options$props === void 0 ? {} : _options$props;
  var stop = function stop2() {
  };
  var load = function load2(_css) {
    var _props = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (!document)
      return;
    var _styleProps = _objectSpread$5(_objectSpread$5({}, props), _props);
    var _name = _styleProps.name || name, _id2 = _styleProps.id || id, _nonce = _styleProps.nonce || nonce;
    styleRef.value = document.querySelector('style[data-primevue-style-id="'.concat(_name, '"]')) || document.getElementById(_id2) || document.createElement("style");
    if (!styleRef.value.isConnected) {
      cssRef.value = _css || css2;
      DomHandler.setAttributes(styleRef.value, {
        type: "text/css",
        id: _id2,
        media,
        nonce: _nonce
      });
      document.head.appendChild(styleRef.value);
      DomHandler.setAttribute(styleRef.value, "data-primevue-style-id", name);
      DomHandler.setAttributes(styleRef.value, _styleProps);
    }
    if (isLoaded.value)
      return;
    stop = watch(cssRef, function(value) {
      styleRef.value.textContent = value;
    }, {
      immediate: true
    });
    isLoaded.value = true;
  };
  var unload = function unload2() {
    if (!document || !isLoaded.value)
      return;
    stop();
    DomHandler.isExist(styleRef.value) && document.head.removeChild(styleRef.value);
    isLoaded.value = false;
  };
  if (immediate && !manual)
    tryOnMounted(load);
  return {
    id,
    name,
    css: cssRef,
    unload,
    load,
    isLoaded: readonly(isLoaded)
  };
}
function _typeof$5(o) {
  "@babel/helpers - typeof";
  return _typeof$5 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$5(o);
}
function _slicedToArray$3(arr, i) {
  return _arrayWithHoles$3(arr) || _iterableToArrayLimit$3(arr, i) || _unsupportedIterableToArray$4(arr, i) || _nonIterableRest$3();
}
function _nonIterableRest$3() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$4(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$4(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$4(o, minLen);
}
function _arrayLikeToArray$4(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit$3(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t)
          return;
        f = false;
      } else
        for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true)
          ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u))
          return;
      } finally {
        if (o)
          throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$3(arr) {
  if (Array.isArray(arr))
    return arr;
}
function ownKeys$4(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$4(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$4(Object(t), true).forEach(function(r2) {
      _defineProperty$4(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$4(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$4(obj, key, value) {
  key = _toPropertyKey$4(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$4(t) {
  var i = _toPrimitive$4(t, "string");
  return "symbol" == _typeof$5(i) ? i : String(i);
}
function _toPrimitive$4(t, r) {
  if ("object" != _typeof$5(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$5(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var css$1 = "\n.p-hidden-accessible {\n    border: 0;\n    clip: rect(0 0 0 0);\n    height: 1px;\n    margin: -1px;\n    overflow: hidden;\n    padding: 0;\n    position: absolute;\n    width: 1px;\n}\n\n.p-hidden-accessible input,\n.p-hidden-accessible select {\n    transform: scale(0);\n}\n\n.p-overflow-hidden {\n    overflow: hidden;\n    padding-right: var(--scrollbar-width);\n}\n";
var classes$3 = {};
var inlineStyles = {};
var BaseStyle = {
  name: "base",
  css: css$1,
  classes: classes$3,
  inlineStyles,
  loadStyle: function loadStyle() {
    var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return this.css ? useStyle(this.css, _objectSpread$4({
      name: this.name
    }, options)) : {};
  },
  getStyleSheet: function getStyleSheet() {
    var extendedCSS = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
    var props = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (this.css) {
      var _props = Object.entries(props).reduce(function(acc, _ref) {
        var _ref2 = _slicedToArray$3(_ref, 2), k = _ref2[0], v = _ref2[1];
        return acc.push("".concat(k, '="').concat(v, '"')) && acc;
      }, []).join(" ");
      return '<style type="text/css" data-primevue-style-id="'.concat(this.name, '" ').concat(_props, ">").concat(this.css).concat(extendedCSS, "</style>");
    }
    return "";
  },
  extend: function extend(style) {
    return _objectSpread$4(_objectSpread$4({}, this), {}, {
      css: void 0
    }, style);
  }
};
var classes$2 = {
  root: "p-badge p-component"
};
var BadgeDirectiveStyle = BaseStyle.extend({
  name: "badge",
  classes: classes$2
});
function _typeof$4(o) {
  "@babel/helpers - typeof";
  return _typeof$4 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$4(o);
}
function _slicedToArray$2(arr, i) {
  return _arrayWithHoles$2(arr) || _iterableToArrayLimit$2(arr, i) || _unsupportedIterableToArray$3(arr, i) || _nonIterableRest$2();
}
function _nonIterableRest$2() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$3(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$3(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$3(o, minLen);
}
function _arrayLikeToArray$3(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit$2(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t)
          return;
        f = false;
      } else
        for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true)
          ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u))
          return;
      } finally {
        if (o)
          throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$2(arr) {
  if (Array.isArray(arr))
    return arr;
}
function ownKeys$3(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$3(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$3(Object(t), true).forEach(function(r2) {
      _defineProperty$3(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$3(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$3(obj, key, value) {
  key = _toPropertyKey$3(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$3(t) {
  var i = _toPrimitive$3(t, "string");
  return "symbol" == _typeof$4(i) ? i : String(i);
}
function _toPrimitive$3(t, r) {
  if ("object" != _typeof$4(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$4(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var BaseDirective = {
  _getMeta: function _getMeta() {
    return [ObjectUtils.isObject(arguments.length <= 0 ? void 0 : arguments[0]) ? void 0 : arguments.length <= 0 ? void 0 : arguments[0], ObjectUtils.getItemValue(ObjectUtils.isObject(arguments.length <= 0 ? void 0 : arguments[0]) ? arguments.length <= 0 ? void 0 : arguments[0] : arguments.length <= 1 ? void 0 : arguments[1])];
  },
  _getConfig: function _getConfig(binding, vnode) {
    var _ref, _binding$instance, _vnode$ctx;
    return (_ref = (binding === null || binding === void 0 || (_binding$instance = binding.instance) === null || _binding$instance === void 0 ? void 0 : _binding$instance.$primevue) || (vnode === null || vnode === void 0 || (_vnode$ctx = vnode.ctx) === null || _vnode$ctx === void 0 || (_vnode$ctx = _vnode$ctx.appContext) === null || _vnode$ctx === void 0 || (_vnode$ctx = _vnode$ctx.config) === null || _vnode$ctx === void 0 || (_vnode$ctx = _vnode$ctx.globalProperties) === null || _vnode$ctx === void 0 ? void 0 : _vnode$ctx.$primevue)) === null || _ref === void 0 ? void 0 : _ref.config;
  },
  _getOptionValue: function _getOptionValue(options) {
    var key = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    var params = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var fKeys = ObjectUtils.toFlatCase(key).split(".");
    var fKey = fKeys.shift();
    return fKey ? ObjectUtils.isObject(options) ? BaseDirective._getOptionValue(ObjectUtils.getItemValue(options[Object.keys(options).find(function(k) {
      return ObjectUtils.toFlatCase(k) === fKey;
    }) || ""], params), fKeys.join("."), params) : void 0 : ObjectUtils.getItemValue(options, params);
  },
  _getPTValue: function _getPTValue() {
    var _instance$binding, _instance$$config;
    var instance = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var obj = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var key = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "";
    var params = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    var searchInDefaultPT = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : true;
    var getValue = function getValue2() {
      var value = BaseDirective._getOptionValue.apply(BaseDirective, arguments);
      return ObjectUtils.isString(value) || ObjectUtils.isArray(value) ? {
        "class": value
      } : value;
    };
    var _ref2 = ((_instance$binding = instance.binding) === null || _instance$binding === void 0 || (_instance$binding = _instance$binding.value) === null || _instance$binding === void 0 ? void 0 : _instance$binding.ptOptions) || ((_instance$$config = instance.$config) === null || _instance$$config === void 0 ? void 0 : _instance$$config.ptOptions) || {}, _ref2$mergeSections = _ref2.mergeSections, mergeSections = _ref2$mergeSections === void 0 ? true : _ref2$mergeSections, _ref2$mergeProps = _ref2.mergeProps, useMergeProps = _ref2$mergeProps === void 0 ? false : _ref2$mergeProps;
    var global2 = searchInDefaultPT ? BaseDirective._useDefaultPT(instance, instance.defaultPT(), getValue, key, params) : void 0;
    var self2 = BaseDirective._usePT(instance, BaseDirective._getPT(obj, instance.$name), getValue, key, _objectSpread$3(_objectSpread$3({}, params), {}, {
      global: global2 || {}
    }));
    var datasets = BaseDirective._getPTDatasets(instance, key);
    return mergeSections || !mergeSections && self2 ? useMergeProps ? BaseDirective._mergeProps(instance, useMergeProps, global2, self2, datasets) : _objectSpread$3(_objectSpread$3(_objectSpread$3({}, global2), self2), datasets) : _objectSpread$3(_objectSpread$3({}, self2), datasets);
  },
  _getPTDatasets: function _getPTDatasets() {
    var instance = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var key = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    var datasetPrefix = "data-pc-";
    return _objectSpread$3(_objectSpread$3({}, key === "root" && _defineProperty$3({}, "".concat(datasetPrefix, "name"), ObjectUtils.toFlatCase(instance.$name))), {}, _defineProperty$3({}, "".concat(datasetPrefix, "section"), ObjectUtils.toFlatCase(key)));
  },
  _getPT: function _getPT(pt) {
    var key = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    var callback = arguments.length > 2 ? arguments[2] : void 0;
    var getValue = function getValue2(value) {
      var _computedValue$_key;
      var computedValue = callback ? callback(value) : value;
      var _key = ObjectUtils.toFlatCase(key);
      return (_computedValue$_key = computedValue === null || computedValue === void 0 ? void 0 : computedValue[_key]) !== null && _computedValue$_key !== void 0 ? _computedValue$_key : computedValue;
    };
    return pt !== null && pt !== void 0 && pt.hasOwnProperty("_usept") ? {
      _usept: pt["_usept"],
      originalValue: getValue(pt.originalValue),
      value: getValue(pt.value)
    } : getValue(pt);
  },
  _usePT: function _usePT() {
    var instance = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var pt = arguments.length > 1 ? arguments[1] : void 0;
    var callback = arguments.length > 2 ? arguments[2] : void 0;
    var key = arguments.length > 3 ? arguments[3] : void 0;
    var params = arguments.length > 4 ? arguments[4] : void 0;
    var fn = function fn2(value2) {
      return callback(value2, key, params);
    };
    if (pt !== null && pt !== void 0 && pt.hasOwnProperty("_usept")) {
      var _instance$$config2;
      var _ref4 = pt["_usept"] || ((_instance$$config2 = instance.$config) === null || _instance$$config2 === void 0 ? void 0 : _instance$$config2.ptOptions) || {}, _ref4$mergeSections = _ref4.mergeSections, mergeSections = _ref4$mergeSections === void 0 ? true : _ref4$mergeSections, _ref4$mergeProps = _ref4.mergeProps, useMergeProps = _ref4$mergeProps === void 0 ? false : _ref4$mergeProps;
      var originalValue = fn(pt.originalValue);
      var value = fn(pt.value);
      if (originalValue === void 0 && value === void 0)
        return void 0;
      else if (ObjectUtils.isString(value))
        return value;
      else if (ObjectUtils.isString(originalValue))
        return originalValue;
      return mergeSections || !mergeSections && value ? useMergeProps ? BaseDirective._mergeProps(instance, useMergeProps, originalValue, value) : _objectSpread$3(_objectSpread$3({}, originalValue), value) : value;
    }
    return fn(pt);
  },
  _useDefaultPT: function _useDefaultPT() {
    var instance = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var defaultPT = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var callback = arguments.length > 2 ? arguments[2] : void 0;
    var key = arguments.length > 3 ? arguments[3] : void 0;
    var params = arguments.length > 4 ? arguments[4] : void 0;
    return BaseDirective._usePT(instance, defaultPT, callback, key, params);
  },
  _hook: function _hook(directiveName, hookName, el, binding, vnode, prevVnode) {
    var _binding$value, _config$pt;
    var name = "on".concat(ObjectUtils.toCapitalCase(hookName));
    var config = BaseDirective._getConfig(binding, vnode);
    var instance = el === null || el === void 0 ? void 0 : el.$instance;
    var selfHook = BaseDirective._usePT(instance, BaseDirective._getPT(binding === null || binding === void 0 || (_binding$value = binding.value) === null || _binding$value === void 0 ? void 0 : _binding$value.pt, directiveName), BaseDirective._getOptionValue, "hooks.".concat(name));
    var defaultHook = BaseDirective._useDefaultPT(instance, config === null || config === void 0 || (_config$pt = config.pt) === null || _config$pt === void 0 || (_config$pt = _config$pt.directives) === null || _config$pt === void 0 ? void 0 : _config$pt[directiveName], BaseDirective._getOptionValue, "hooks.".concat(name));
    var options = {
      el,
      binding,
      vnode,
      prevVnode
    };
    selfHook === null || selfHook === void 0 || selfHook(instance, options);
    defaultHook === null || defaultHook === void 0 || defaultHook(instance, options);
  },
  _mergeProps: function _mergeProps() {
    var fn = arguments.length > 1 ? arguments[1] : void 0;
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key2 = 2; _key2 < _len; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }
    return ObjectUtils.isFunction(fn) ? fn.apply(void 0, args) : mergeProps.apply(void 0, args);
  },
  _extend: function _extend(name) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var handleHook = function handleHook2(hook, el, binding, vnode, prevVnode) {
      var _el$$instance$hook, _el$$instance7;
      el._$instances = el._$instances || {};
      var config = BaseDirective._getConfig(binding, vnode);
      var $prevInstance = el._$instances[name] || {};
      var $options = ObjectUtils.isEmpty($prevInstance) ? _objectSpread$3(_objectSpread$3({}, options), options === null || options === void 0 ? void 0 : options.methods) : {};
      el._$instances[name] = _objectSpread$3(_objectSpread$3({}, $prevInstance), {}, {
        /* new instance variables to pass in directive methods */
        $name: name,
        $host: el,
        $binding: binding,
        $modifiers: binding === null || binding === void 0 ? void 0 : binding.modifiers,
        $value: binding === null || binding === void 0 ? void 0 : binding.value,
        $el: $prevInstance["$el"] || el || void 0,
        $style: _objectSpread$3({
          classes: void 0,
          inlineStyles: void 0,
          loadStyle: function loadStyle2() {
          }
        }, options === null || options === void 0 ? void 0 : options.style),
        $config: config,
        /* computed instance variables */
        defaultPT: function defaultPT() {
          return BaseDirective._getPT(config === null || config === void 0 ? void 0 : config.pt, void 0, function(value) {
            var _value$directives;
            return value === null || value === void 0 || (_value$directives = value.directives) === null || _value$directives === void 0 ? void 0 : _value$directives[name];
          });
        },
        isUnstyled: function isUnstyled() {
          var _el$$instance, _el$$instance2;
          return ((_el$$instance = el.$instance) === null || _el$$instance === void 0 || (_el$$instance = _el$$instance.$binding) === null || _el$$instance === void 0 || (_el$$instance = _el$$instance.value) === null || _el$$instance === void 0 ? void 0 : _el$$instance.unstyled) !== void 0 ? (_el$$instance2 = el.$instance) === null || _el$$instance2 === void 0 || (_el$$instance2 = _el$$instance2.$binding) === null || _el$$instance2 === void 0 || (_el$$instance2 = _el$$instance2.value) === null || _el$$instance2 === void 0 ? void 0 : _el$$instance2.unstyled : config === null || config === void 0 ? void 0 : config.unstyled;
        },
        /* instance's methods */
        ptm: function ptm() {
          var _el$$instance3;
          var key = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
          var params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          return BaseDirective._getPTValue(el.$instance, (_el$$instance3 = el.$instance) === null || _el$$instance3 === void 0 || (_el$$instance3 = _el$$instance3.$binding) === null || _el$$instance3 === void 0 || (_el$$instance3 = _el$$instance3.value) === null || _el$$instance3 === void 0 ? void 0 : _el$$instance3.pt, key, _objectSpread$3({}, params));
        },
        ptmo: function ptmo() {
          var obj = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          var key = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
          var params = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
          return BaseDirective._getPTValue(el.$instance, obj, key, params, false);
        },
        cx: function cx() {
          var _el$$instance4, _el$$instance5;
          var key = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
          var params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          return !((_el$$instance4 = el.$instance) !== null && _el$$instance4 !== void 0 && _el$$instance4.isUnstyled()) ? BaseDirective._getOptionValue((_el$$instance5 = el.$instance) === null || _el$$instance5 === void 0 || (_el$$instance5 = _el$$instance5.$style) === null || _el$$instance5 === void 0 ? void 0 : _el$$instance5.classes, key, _objectSpread$3({}, params)) : void 0;
        },
        sx: function sx() {
          var _el$$instance6;
          var key = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
          var when = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
          var params = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
          return when ? BaseDirective._getOptionValue((_el$$instance6 = el.$instance) === null || _el$$instance6 === void 0 || (_el$$instance6 = _el$$instance6.$style) === null || _el$$instance6 === void 0 ? void 0 : _el$$instance6.inlineStyles, key, _objectSpread$3({}, params)) : void 0;
        }
      }, $options);
      el.$instance = el._$instances[name];
      (_el$$instance$hook = (_el$$instance7 = el.$instance)[hook]) === null || _el$$instance$hook === void 0 || _el$$instance$hook.call(_el$$instance7, el, binding, vnode, prevVnode);
      el["$".concat(name)] = el.$instance;
      BaseDirective._hook(name, hook, el, binding, vnode, prevVnode);
    };
    return {
      created: function created2(el, binding, vnode, prevVnode) {
        handleHook("created", el, binding, vnode, prevVnode);
      },
      beforeMount: function beforeMount2(el, binding, vnode, prevVnode) {
        var _config$csp, _el$$instance8, _el$$instance9, _config$csp2;
        var config = BaseDirective._getConfig(binding, vnode);
        BaseStyle.loadStyle({
          nonce: config === null || config === void 0 || (_config$csp = config.csp) === null || _config$csp === void 0 ? void 0 : _config$csp.nonce
        });
        !((_el$$instance8 = el.$instance) !== null && _el$$instance8 !== void 0 && _el$$instance8.isUnstyled()) && ((_el$$instance9 = el.$instance) === null || _el$$instance9 === void 0 || (_el$$instance9 = _el$$instance9.$style) === null || _el$$instance9 === void 0 ? void 0 : _el$$instance9.loadStyle({
          nonce: config === null || config === void 0 || (_config$csp2 = config.csp) === null || _config$csp2 === void 0 ? void 0 : _config$csp2.nonce
        }));
        handleHook("beforeMount", el, binding, vnode, prevVnode);
      },
      mounted: function mounted6(el, binding, vnode, prevVnode) {
        var _config$csp3, _el$$instance10, _el$$instance11, _config$csp4;
        var config = BaseDirective._getConfig(binding, vnode);
        BaseStyle.loadStyle({
          nonce: config === null || config === void 0 || (_config$csp3 = config.csp) === null || _config$csp3 === void 0 ? void 0 : _config$csp3.nonce
        });
        !((_el$$instance10 = el.$instance) !== null && _el$$instance10 !== void 0 && _el$$instance10.isUnstyled()) && ((_el$$instance11 = el.$instance) === null || _el$$instance11 === void 0 || (_el$$instance11 = _el$$instance11.$style) === null || _el$$instance11 === void 0 ? void 0 : _el$$instance11.loadStyle({
          nonce: config === null || config === void 0 || (_config$csp4 = config.csp) === null || _config$csp4 === void 0 ? void 0 : _config$csp4.nonce
        }));
        handleHook("mounted", el, binding, vnode, prevVnode);
      },
      beforeUpdate: function beforeUpdate(el, binding, vnode, prevVnode) {
        handleHook("beforeUpdate", el, binding, vnode, prevVnode);
      },
      updated: function updated4(el, binding, vnode, prevVnode) {
        handleHook("updated", el, binding, vnode, prevVnode);
      },
      beforeUnmount: function beforeUnmount(el, binding, vnode, prevVnode) {
        handleHook("beforeUnmount", el, binding, vnode, prevVnode);
      },
      unmounted: function unmounted6(el, binding, vnode, prevVnode) {
        handleHook("unmounted", el, binding, vnode, prevVnode);
      }
    };
  },
  extend: function extend2() {
    var _BaseDirective$_getMe = BaseDirective._getMeta.apply(BaseDirective, arguments), _BaseDirective$_getMe2 = _slicedToArray$2(_BaseDirective$_getMe, 2), name = _BaseDirective$_getMe2[0], options = _BaseDirective$_getMe2[1];
    return _objectSpread$3({
      extend: function extend3() {
        var _BaseDirective$_getMe3 = BaseDirective._getMeta.apply(BaseDirective, arguments), _BaseDirective$_getMe4 = _slicedToArray$2(_BaseDirective$_getMe3, 2), _name = _BaseDirective$_getMe4[0], _options = _BaseDirective$_getMe4[1];
        return BaseDirective.extend(_name, _objectSpread$3(_objectSpread$3(_objectSpread$3({}, options), options === null || options === void 0 ? void 0 : options.methods), _options));
      }
    }, BaseDirective._extend(name, options));
  }
};
var BaseBadgeDirective = BaseDirective.extend({
  style: BadgeDirectiveStyle
});
function _typeof$3(o) {
  "@babel/helpers - typeof";
  return _typeof$3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$3(o);
}
function ownKeys$2(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$2(Object(t), true).forEach(function(r2) {
      _defineProperty$2(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$2(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$2(obj, key, value) {
  key = _toPropertyKey$2(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$2(t) {
  var i = _toPrimitive$2(t, "string");
  return "symbol" == _typeof$3(i) ? i : String(i);
}
function _toPrimitive$2(t, r) {
  if ("object" != _typeof$3(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$3(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var BadgeDirective = BaseBadgeDirective.extend("badge", {
  mounted: function mounted(el, binding) {
    var id = UniqueComponentId() + "_badge";
    var badge2 = DomHandler.createElement("span", {
      id,
      "class": !this.isUnstyled() && this.cx("root"),
      "p-bind": this.ptm("root", {
        context: _objectSpread$2(_objectSpread$2({}, binding.modifiers), {}, {
          nogutter: String(binding.value).length === 1,
          dot: binding.value == null
        })
      })
    });
    el.$_pbadgeId = badge2.getAttribute("id");
    for (var modifier in binding.modifiers) {
      !this.isUnstyled() && DomHandler.addClass(badge2, "p-badge-" + modifier);
    }
    if (binding.value != null) {
      if (_typeof$3(binding.value) === "object")
        el.$_badgeValue = binding.value.value;
      else
        el.$_badgeValue = binding.value;
      badge2.appendChild((void 0).createTextNode(el.$_badgeValue));
      if (String(el.$_badgeValue).length === 1 && !this.isUnstyled()) {
        !this.isUnstyled() && DomHandler.addClass(badge2, "p-badge-no-gutter");
      }
    } else {
      !this.isUnstyled() && DomHandler.addClass(badge2, "p-badge-dot");
    }
    el.setAttribute("data-pd-badge", true);
    !this.isUnstyled() && DomHandler.addClass(el, "p-overlay-badge");
    el.setAttribute("data-p-overlay-badge", "true");
    el.appendChild(badge2);
    this.$el = badge2;
  },
  updated: function updated(el, binding) {
    !this.isUnstyled() && DomHandler.addClass(el, "p-overlay-badge");
    el.setAttribute("data-p-overlay-badge", "true");
    if (binding.oldValue !== binding.value) {
      var badge2 = (void 0).getElementById(el.$_pbadgeId);
      if (_typeof$3(binding.value) === "object")
        el.$_badgeValue = binding.value.value;
      else
        el.$_badgeValue = binding.value;
      if (!this.isUnstyled()) {
        if (el.$_badgeValue) {
          if (DomHandler.hasClass(badge2, "p-badge-dot"))
            DomHandler.removeClass(badge2, "p-badge-dot");
          if (el.$_badgeValue.length === 1)
            DomHandler.addClass(badge2, "p-badge-no-gutter");
          else
            DomHandler.removeClass(badge2, "p-badge-no-gutter");
        } else if (!el.$_badgeValue && !DomHandler.hasClass(badge2, "p-badge-dot")) {
          DomHandler.addClass(badge2, "p-badge-dot");
        }
      }
      badge2.innerHTML = "";
      badge2.appendChild((void 0).createTextNode(el.$_badgeValue));
    }
  }
});
var classes$1 = {
  root: "p-tooltip p-component",
  arrow: "p-tooltip-arrow",
  text: "p-tooltip-text"
};
var TooltipStyle = BaseStyle.extend({
  name: "tooltip",
  classes: classes$1
});
var BaseTooltip = BaseDirective.extend({
  style: TooltipStyle
});
function _slicedToArray$1(arr, i) {
  return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _unsupportedIterableToArray$2(arr, i) || _nonIterableRest$1();
}
function _nonIterableRest$1() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$2(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$2(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$2(o, minLen);
}
function _arrayLikeToArray$2(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit$1(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t)
          return;
        f = false;
      } else
        for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true)
          ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u))
          return;
      } finally {
        if (o)
          throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$1(arr) {
  if (Array.isArray(arr))
    return arr;
}
function _typeof$2(o) {
  "@babel/helpers - typeof";
  return _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$2(o);
}
var Tooltip = BaseTooltip.extend("tooltip", {
  beforeMount: function beforeMount(el, options) {
    var _options$instance$$pr;
    var target = this.getTarget(el);
    target.$_ptooltipModifiers = this.getModifiers(options);
    if (!options.value)
      return;
    else if (typeof options.value === "string") {
      target.$_ptooltipValue = options.value;
      target.$_ptooltipDisabled = false;
      target.$_ptooltipEscape = true;
      target.$_ptooltipClass = null;
      target.$_ptooltipFitContent = true;
      target.$_ptooltipIdAttr = UniqueComponentId() + "_tooltip";
      target.$_ptooltipShowDelay = 0;
      target.$_ptooltipHideDelay = 0;
      target.$_ptooltipAutoHide = true;
    } else if (_typeof$2(options.value) === "object" && options.value) {
      if (ObjectUtils.isEmpty(options.value.value) || options.value.value.trim() === "")
        return;
      else {
        target.$_ptooltipValue = options.value.value;
        target.$_ptooltipDisabled = !!options.value.disabled === options.value.disabled ? options.value.disabled : false;
        target.$_ptooltipEscape = !!options.value.escape === options.value.escape ? options.value.escape : true;
        target.$_ptooltipClass = options.value["class"] || "";
        target.$_ptooltipFitContent = !!options.value.fitContent === options.value.fitContent ? options.value.fitContent : true;
        target.$_ptooltipIdAttr = options.value.id || UniqueComponentId() + "_tooltip";
        target.$_ptooltipShowDelay = options.value.showDelay || 0;
        target.$_ptooltipHideDelay = options.value.hideDelay || 0;
        target.$_ptooltipAutoHide = !!options.value.autoHide === options.value.autoHide ? options.value.autoHide : true;
      }
    }
    target.$_ptooltipZIndex = (_options$instance$$pr = options.instance.$primevue) === null || _options$instance$$pr === void 0 || (_options$instance$$pr = _options$instance$$pr.config) === null || _options$instance$$pr === void 0 || (_options$instance$$pr = _options$instance$$pr.zIndex) === null || _options$instance$$pr === void 0 ? void 0 : _options$instance$$pr.tooltip;
    this.bindEvents(target, options);
    el.setAttribute("data-pd-tooltip", true);
  },
  updated: function updated2(el, options) {
    var target = this.getTarget(el);
    target.$_ptooltipModifiers = this.getModifiers(options);
    this.unbindEvents(target);
    if (!options.value) {
      return;
    }
    if (typeof options.value === "string") {
      target.$_ptooltipValue = options.value;
      target.$_ptooltipDisabled = false;
      target.$_ptooltipEscape = true;
      target.$_ptooltipClass = null;
      target.$_ptooltipIdAttr = target.$_ptooltipIdAttr || UniqueComponentId() + "_tooltip";
      target.$_ptooltipShowDelay = 0;
      target.$_ptooltipHideDelay = 0;
      target.$_ptooltipAutoHide = true;
      this.bindEvents(target, options);
    } else if (_typeof$2(options.value) === "object" && options.value) {
      if (ObjectUtils.isEmpty(options.value.value) || options.value.value.trim() === "") {
        this.unbindEvents(target, options);
        return;
      } else {
        target.$_ptooltipValue = options.value.value;
        target.$_ptooltipDisabled = !!options.value.disabled === options.value.disabled ? options.value.disabled : false;
        target.$_ptooltipEscape = !!options.value.escape === options.value.escape ? options.value.escape : true;
        target.$_ptooltipClass = options.value["class"] || "";
        target.$_ptooltipFitContent = !!options.value.fitContent === options.value.fitContent ? options.value.fitContent : true;
        target.$_ptooltipIdAttr = options.value.id || target.$_ptooltipIdAttr || UniqueComponentId() + "_tooltip";
        target.$_ptooltipShowDelay = options.value.showDelay || 0;
        target.$_ptooltipHideDelay = options.value.hideDelay || 0;
        target.$_ptooltipAutoHide = !!options.value.autoHide === options.value.autoHide ? options.value.autoHide : true;
        this.bindEvents(target, options);
      }
    }
  },
  unmounted: function unmounted(el, options) {
    var target = this.getTarget(el);
    this.remove(target);
    this.unbindEvents(target, options);
    if (target.$_ptooltipScrollHandler) {
      target.$_ptooltipScrollHandler.destroy();
      target.$_ptooltipScrollHandler = null;
    }
  },
  timer: void 0,
  methods: {
    bindEvents: function bindEvents(el, options) {
      var _this = this;
      var modifiers = el.$_ptooltipModifiers;
      if (modifiers.focus) {
        el.$_focusevent = function(event) {
          return _this.onFocus(event, options);
        };
        el.addEventListener("focus", el.$_focusevent);
        el.addEventListener("blur", this.onBlur.bind(this));
      } else {
        el.$_mouseenterevent = function(event) {
          return _this.onMouseEnter(event, options);
        };
        el.addEventListener("mouseenter", el.$_mouseenterevent);
        el.addEventListener("mouseleave", this.onMouseLeave.bind(this));
        el.addEventListener("click", this.onClick.bind(this));
      }
      el.addEventListener("keydown", this.onKeydown.bind(this));
    },
    unbindEvents: function unbindEvents(el) {
      var modifiers = el.$_ptooltipModifiers;
      if (modifiers.focus) {
        el.removeEventListener("focus", el.$_focusevent);
        el.$_focusevent = null;
        el.removeEventListener("blur", this.onBlur.bind(this));
      } else {
        el.removeEventListener("mouseenter", el.$_mouseenterevent);
        el.$_mouseenterevent = null;
        el.removeEventListener("mouseleave", this.onMouseLeave.bind(this));
        el.removeEventListener("click", this.onClick.bind(this));
      }
      el.removeEventListener("keydown", this.onKeydown.bind(this));
    },
    bindScrollListener: function bindScrollListener(el) {
      var _this2 = this;
      if (!el.$_ptooltipScrollHandler) {
        el.$_ptooltipScrollHandler = new ConnectedOverlayScrollHandler(el, function() {
          _this2.hide(el);
        });
      }
      el.$_ptooltipScrollHandler.bindScrollListener();
    },
    unbindScrollListener: function unbindScrollListener(el) {
      if (el.$_ptooltipScrollHandler) {
        el.$_ptooltipScrollHandler.unbindScrollListener();
      }
    },
    onMouseEnter: function onMouseEnter(event, options) {
      var el = event.currentTarget;
      var showDelay = el.$_ptooltipShowDelay;
      this.show(el, options, showDelay);
    },
    onMouseLeave: function onMouseLeave(event) {
      var el = event.currentTarget;
      var hideDelay = el.$_ptooltipHideDelay;
      var autoHide = el.$_ptooltipAutoHide;
      if (!autoHide) {
        var valid = DomHandler.getAttribute(event.target, "data-pc-name") === "tooltip" || DomHandler.getAttribute(event.target, "data-pc-section") === "arrow" || DomHandler.getAttribute(event.target, "data-pc-section") === "text" || DomHandler.getAttribute(event.relatedTarget, "data-pc-name") === "tooltip" || DomHandler.getAttribute(event.relatedTarget, "data-pc-section") === "arrow" || DomHandler.getAttribute(event.relatedTarget, "data-pc-section") === "text";
        !valid && this.hide(el, hideDelay);
      } else {
        this.hide(el, hideDelay);
      }
    },
    onFocus: function onFocus(event, options) {
      var el = event.currentTarget;
      var showDelay = el.$_ptooltipShowDelay;
      this.show(el, options, showDelay);
    },
    onBlur: function onBlur(event) {
      var el = event.currentTarget;
      var hideDelay = el.$_ptooltipHideDelay;
      this.hide(el, hideDelay);
    },
    onClick: function onClick(event) {
      var el = event.currentTarget;
      var hideDelay = el.$_ptooltipHideDelay;
      this.hide(el, hideDelay);
    },
    onKeydown: function onKeydown(event) {
      var el = event.currentTarget;
      var hideDelay = el.$_ptooltipHideDelay;
      event.code === "Escape" && this.hide(event.currentTarget, hideDelay);
    },
    tooltipActions: function tooltipActions(el, options) {
      if (el.$_ptooltipDisabled || !DomHandler.isExist(el)) {
        return;
      }
      var tooltipElement = this.create(el, options);
      this.align(el);
      !this.isUnstyled() && DomHandler.fadeIn(tooltipElement, 250);
      var $this = this;
      (void 0).addEventListener("resize", function onWindowResize() {
        if (!DomHandler.isTouchDevice()) {
          $this.hide(el);
        }
        (void 0).removeEventListener("resize", onWindowResize);
      });
      tooltipElement.addEventListener("mouseleave", function onTooltipLeave() {
        $this.hide(el);
        tooltipElement.removeEventListener("mouseleave", onTooltipLeave);
      });
      this.bindScrollListener(el);
      ZIndexUtils.set("tooltip", tooltipElement, el.$_ptooltipZIndex);
    },
    show: function show(el, options, showDelay) {
      var _this3 = this;
      if (showDelay !== void 0) {
        this.timer = setTimeout(function() {
          return _this3.tooltipActions(el, options);
        }, showDelay);
      } else {
        this.tooltipActions(el, options);
      }
    },
    tooltipRemoval: function tooltipRemoval(el) {
      this.remove(el);
      this.unbindScrollListener(el);
    },
    hide: function hide(el, hideDelay) {
      var _this4 = this;
      clearTimeout(this.timer);
      if (hideDelay !== void 0) {
        setTimeout(function() {
          return _this4.tooltipRemoval(el);
        }, hideDelay);
      } else {
        this.tooltipRemoval(el);
      }
    },
    getTooltipElement: function getTooltipElement(el) {
      return (void 0).getElementById(el.$_ptooltipId);
    },
    create: function create(el, options) {
      var modifiers = el.$_ptooltipModifiers;
      var tooltipArrow = DomHandler.createElement("div", {
        "class": !this.isUnstyled() && this.cx("arrow"),
        style: {
          top: modifiers !== null && modifiers !== void 0 && modifiers.bottom ? "0" : modifiers !== null && modifiers !== void 0 && modifiers.right || modifiers !== null && modifiers !== void 0 && modifiers.left || !(modifiers !== null && modifiers !== void 0 && modifiers.right) && !(modifiers !== null && modifiers !== void 0 && modifiers.left) && !(modifiers !== null && modifiers !== void 0 && modifiers.top) && !(modifiers !== null && modifiers !== void 0 && modifiers.bottom) ? "50%" : null,
          bottom: modifiers !== null && modifiers !== void 0 && modifiers.top ? "0" : null,
          left: modifiers !== null && modifiers !== void 0 && modifiers.right || !(modifiers !== null && modifiers !== void 0 && modifiers.right) && !(modifiers !== null && modifiers !== void 0 && modifiers.left) && !(modifiers !== null && modifiers !== void 0 && modifiers.top) && !(modifiers !== null && modifiers !== void 0 && modifiers.bottom) ? "0" : modifiers !== null && modifiers !== void 0 && modifiers.top || modifiers !== null && modifiers !== void 0 && modifiers.bottom ? "50%" : null,
          right: modifiers !== null && modifiers !== void 0 && modifiers.left ? "0" : null
        },
        "p-bind": this.ptm("arrow", {
          context: modifiers
        })
      });
      var tooltipText = DomHandler.createElement("div", {
        "class": !this.isUnstyled() && this.cx("text"),
        "p-bind": this.ptm("text", {
          context: modifiers
        })
      });
      if (!el.$_ptooltipEscape) {
        tooltipText.innerHTML = el.$_ptooltipValue;
      } else {
        tooltipText.innerHTML = "";
        tooltipText.appendChild((void 0).createTextNode(el.$_ptooltipValue));
      }
      var container = DomHandler.createElement("div", {
        id: el.$_ptooltipIdAttr,
        role: "tooltip",
        style: {
          display: "inline-block",
          width: el.$_ptooltipFitContent ? "fit-content" : void 0,
          pointerEvents: !this.isUnstyled() && el.$_ptooltipAutoHide && "none"
        },
        "class": [!this.isUnstyled() && this.cx("root"), el.$_ptooltipClass],
        "p-bind": this.ptm("root", {
          context: modifiers
        })
      }, tooltipArrow, tooltipText);
      (void 0).body.appendChild(container);
      el.$_ptooltipId = container.id;
      this.$el = container;
      return container;
    },
    remove: function remove(el) {
      if (el) {
        var tooltipElement = this.getTooltipElement(el);
        if (tooltipElement && tooltipElement.parentElement) {
          ZIndexUtils.clear(tooltipElement);
          (void 0).body.removeChild(tooltipElement);
        }
        el.$_ptooltipId = null;
      }
    },
    align: function align(el) {
      var modifiers = el.$_ptooltipModifiers;
      if (modifiers.top) {
        this.alignTop(el);
        if (this.isOutOfBounds(el)) {
          this.alignBottom(el);
          if (this.isOutOfBounds(el)) {
            this.alignTop(el);
          }
        }
      } else if (modifiers.left) {
        this.alignLeft(el);
        if (this.isOutOfBounds(el)) {
          this.alignRight(el);
          if (this.isOutOfBounds(el)) {
            this.alignTop(el);
            if (this.isOutOfBounds(el)) {
              this.alignBottom(el);
              if (this.isOutOfBounds(el)) {
                this.alignLeft(el);
              }
            }
          }
        }
      } else if (modifiers.bottom) {
        this.alignBottom(el);
        if (this.isOutOfBounds(el)) {
          this.alignTop(el);
          if (this.isOutOfBounds(el)) {
            this.alignBottom(el);
          }
        }
      } else {
        this.alignRight(el);
        if (this.isOutOfBounds(el)) {
          this.alignLeft(el);
          if (this.isOutOfBounds(el)) {
            this.alignTop(el);
            if (this.isOutOfBounds(el)) {
              this.alignBottom(el);
              if (this.isOutOfBounds(el)) {
                this.alignRight(el);
              }
            }
          }
        }
      }
    },
    getHostOffset: function getHostOffset(el) {
      var offset = el.getBoundingClientRect();
      var targetLeft = offset.left + DomHandler.getWindowScrollLeft();
      var targetTop = offset.top + DomHandler.getWindowScrollTop();
      return {
        left: targetLeft,
        top: targetTop
      };
    },
    alignRight: function alignRight(el) {
      this.preAlign(el, "right");
      var tooltipElement = this.getTooltipElement(el);
      var hostOffset = this.getHostOffset(el);
      var left = hostOffset.left + DomHandler.getOuterWidth(el);
      var top = hostOffset.top + (DomHandler.getOuterHeight(el) - DomHandler.getOuterHeight(tooltipElement)) / 2;
      tooltipElement.style.left = left + "px";
      tooltipElement.style.top = top + "px";
    },
    alignLeft: function alignLeft(el) {
      this.preAlign(el, "left");
      var tooltipElement = this.getTooltipElement(el);
      var hostOffset = this.getHostOffset(el);
      var left = hostOffset.left - DomHandler.getOuterWidth(tooltipElement);
      var top = hostOffset.top + (DomHandler.getOuterHeight(el) - DomHandler.getOuterHeight(tooltipElement)) / 2;
      tooltipElement.style.left = left + "px";
      tooltipElement.style.top = top + "px";
    },
    alignTop: function alignTop(el) {
      this.preAlign(el, "top");
      var tooltipElement = this.getTooltipElement(el);
      var hostOffset = this.getHostOffset(el);
      var left = hostOffset.left + (DomHandler.getOuterWidth(el) - DomHandler.getOuterWidth(tooltipElement)) / 2;
      var top = hostOffset.top - DomHandler.getOuterHeight(tooltipElement);
      tooltipElement.style.left = left + "px";
      tooltipElement.style.top = top + "px";
    },
    alignBottom: function alignBottom(el) {
      this.preAlign(el, "bottom");
      var tooltipElement = this.getTooltipElement(el);
      var hostOffset = this.getHostOffset(el);
      var left = hostOffset.left + (DomHandler.getOuterWidth(el) - DomHandler.getOuterWidth(tooltipElement)) / 2;
      var top = hostOffset.top + DomHandler.getOuterHeight(el);
      tooltipElement.style.left = left + "px";
      tooltipElement.style.top = top + "px";
    },
    preAlign: function preAlign(el, position) {
      var tooltipElement = this.getTooltipElement(el);
      tooltipElement.style.left = "-999px";
      tooltipElement.style.top = "-999px";
      DomHandler.removeClass(tooltipElement, "p-tooltip-".concat(tooltipElement.$_ptooltipPosition));
      !this.isUnstyled() && DomHandler.addClass(tooltipElement, "p-tooltip-".concat(position));
      tooltipElement.$_ptooltipPosition = position;
      tooltipElement.setAttribute("data-p-position", position);
    },
    isOutOfBounds: function isOutOfBounds(el) {
      var tooltipElement = this.getTooltipElement(el);
      var offset = tooltipElement.getBoundingClientRect();
      var targetTop = offset.top;
      var targetLeft = offset.left;
      var width2 = DomHandler.getOuterWidth(tooltipElement);
      var height = DomHandler.getOuterHeight(tooltipElement);
      var viewport = DomHandler.getViewport();
      return targetLeft + width2 > viewport.width || targetLeft < 0 || targetTop < 0 || targetTop + height > viewport.height;
    },
    getTarget: function getTarget(el) {
      return DomHandler.hasClass(el, "p-inputwrapper") ? DomHandler.findSingle(el, "input") : el;
    },
    getModifiers: function getModifiers(options) {
      if (options.modifiers && Object.keys(options.modifiers).length) {
        return options.modifiers;
      }
      if (options.arg && _typeof$2(options.arg) === "object") {
        return Object.entries(options.arg).reduce(function(acc, _ref) {
          var _ref2 = _slicedToArray$1(_ref, 2), key = _ref2[0], val = _ref2[1];
          if (key === "event" || key === "position")
            acc[val] = true;
          return acc;
        }, {});
      }
      return {};
    }
  }
});
var classes = {
  root: "p-ink"
};
var RippleStyle = BaseStyle.extend({
  name: "ripple",
  classes
});
var BaseRipple = BaseDirective.extend({
  style: RippleStyle
});
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray$1(arr) || _nonIterableSpread();
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$1(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray$1(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray$1(o, minLen);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr))
    return _arrayLikeToArray$1(arr);
}
function _arrayLikeToArray$1(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
var Ripple = BaseRipple.extend("ripple", {
  mounted: function mounted2(el) {
    var _el$$instance;
    var config = el === null || el === void 0 || (_el$$instance = el.$instance) === null || _el$$instance === void 0 ? void 0 : _el$$instance.$config;
    if (config && config.ripple) {
      this.create(el);
      this.bindEvents(el);
      el.setAttribute("data-pd-ripple", true);
    }
  },
  unmounted: function unmounted2(el) {
    this.remove(el);
  },
  timeout: void 0,
  methods: {
    bindEvents: function bindEvents2(el) {
      el.addEventListener("mousedown", this.onMouseDown.bind(this));
    },
    unbindEvents: function unbindEvents2(el) {
      el.removeEventListener("mousedown", this.onMouseDown.bind(this));
    },
    create: function create2(el) {
      var ink = DomHandler.createElement("span", {
        role: "presentation",
        "aria-hidden": true,
        "data-p-ink": true,
        "data-p-ink-active": false,
        "class": !this.isUnstyled() && this.cx("root"),
        onAnimationEnd: this.onAnimationEnd.bind(this),
        "p-bind": this.ptm("root")
      });
      el.appendChild(ink);
      this.$el = ink;
    },
    remove: function remove2(el) {
      var ink = this.getInk(el);
      if (ink) {
        this.unbindEvents(el);
        ink.removeEventListener("animationend", this.onAnimationEnd);
        ink.remove();
      }
    },
    onMouseDown: function onMouseDown(event) {
      var _this = this;
      var target = event.currentTarget;
      var ink = this.getInk(target);
      if (!ink || getComputedStyle(ink, null).display === "none") {
        return;
      }
      !this.isUnstyled() && DomHandler.removeClass(ink, "p-ink-active");
      ink.setAttribute("data-p-ink-active", "false");
      if (!DomHandler.getHeight(ink) && !DomHandler.getWidth(ink)) {
        var d = Math.max(DomHandler.getOuterWidth(target), DomHandler.getOuterHeight(target));
        ink.style.height = d + "px";
        ink.style.width = d + "px";
      }
      var offset = DomHandler.getOffset(target);
      var x = event.pageX - offset.left + (void 0).body.scrollTop - DomHandler.getWidth(ink) / 2;
      var y = event.pageY - offset.top + (void 0).body.scrollLeft - DomHandler.getHeight(ink) / 2;
      ink.style.top = y + "px";
      ink.style.left = x + "px";
      !this.isUnstyled() && DomHandler.addClass(ink, "p-ink-active");
      ink.setAttribute("data-p-ink-active", "true");
      this.timeout = setTimeout(function() {
        if (ink) {
          !_this.isUnstyled() && DomHandler.removeClass(ink, "p-ink-active");
          ink.setAttribute("data-p-ink-active", "false");
        }
      }, 401);
    },
    onAnimationEnd: function onAnimationEnd(event) {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      !this.isUnstyled() && DomHandler.removeClass(event.currentTarget, "p-ink-active");
      event.currentTarget.setAttribute("data-p-ink-active", "false");
    },
    getInk: function getInk(el) {
      return el && el.children ? _toConsumableArray(el.children).find(function(child) {
        return DomHandler.getAttribute(child, "data-pc-name") === "ripple";
      }) : void 0;
    }
  }
});
var BaseStyleClass = BaseDirective.extend({});
var StyleClass = BaseStyleClass.extend("styleclass", {
  mounted: function mounted3(el, binding) {
    el.setAttribute("data-pd-styleclass", true);
    this.bind(el, binding);
  },
  unmounted: function unmounted3(el) {
    this.unbind(el);
  },
  methods: {
    bind: function bind(el, binding) {
      var _this = this;
      var target = this.resolveTarget(el, binding);
      this.$el = target;
      el.$_pstyleclass_clicklistener = function() {
        if (binding.value.toggleClass) {
          if (DomHandler.hasClass(target, binding.value.toggleClass))
            DomHandler.removeClass(target, binding.value.toggleClass);
          else
            DomHandler.addClass(target, binding.value.toggleClass);
        } else {
          if (target.offsetParent === null)
            _this.enter(target, el, binding);
          else
            _this.leave(target, binding);
        }
      };
      el.addEventListener("click", el.$_pstyleclass_clicklistener);
    },
    unbind: function unbind(el) {
      if (el.$_pstyleclass_clicklistener) {
        el.removeEventListener("click", el.$_pstyleclass_clicklistener);
        el.$_pstyleclass_clicklistener = null;
      }
      this.unbindDocumentListener(el);
    },
    enter: function enter(target, el, binding) {
      if (binding.value.enterActiveClass) {
        if (!target.$_pstyleclass_animating) {
          target.$_pstyleclass_animating = true;
          if (binding.value.enterActiveClass === "slidedown") {
            target.style.height = "0px";
            DomHandler.removeClass(target, "hidden");
            target.style.maxHeight = target.scrollHeight + "px";
            DomHandler.addClass(target, "hidden");
            target.style.height = "";
          }
          DomHandler.addClass(target, binding.value.enterActiveClass);
          if (binding.value.enterClass) {
            DomHandler.removeClass(target, binding.value.enterClass);
          }
          if (binding.value.enterFromClass) {
            DomHandler.removeClass(target, binding.value.enterFromClass);
          }
          target.$p_styleclass_enterlistener = function() {
            DomHandler.removeClass(target, binding.value.enterActiveClass);
            if (binding.value.enterToClass) {
              DomHandler.addClass(target, binding.value.enterToClass);
            }
            target.removeEventListener("animationend", target.$p_styleclass_enterlistener);
            if (binding.value.enterActiveClass === "slidedown") {
              target.style.maxHeight = "";
            }
            target.$_pstyleclass_animating = false;
          };
          target.addEventListener("animationend", target.$p_styleclass_enterlistener);
        }
      } else {
        if (binding.value.enterClass) {
          DomHandler.removeClass(target, binding.value.enterClass);
        }
        if (binding.value.enterFromClass) {
          DomHandler.removeClass(target, binding.value.enterFromClass);
        }
        if (binding.value.enterToClass) {
          DomHandler.addClass(target, binding.value.enterToClass);
        }
      }
      if (binding.value.hideOnOutsideClick) {
        this.bindDocumentListener(target, el, binding);
      }
    },
    leave: function leave(target, binding) {
      if (binding.value.leaveActiveClass) {
        if (!target.$_pstyleclass_animating) {
          target.$_pstyleclass_animating = true;
          DomHandler.addClass(target, binding.value.leaveActiveClass);
          if (binding.value.leaveClass) {
            DomHandler.removeClass(target, binding.value.leaveClass);
          }
          if (binding.value.leaveFromClass) {
            DomHandler.removeClass(target, binding.value.leaveFromClass);
          }
          target.$p_styleclass_leavelistener = function() {
            DomHandler.removeClass(target, binding.value.leaveActiveClass);
            if (binding.value.leaveToClass) {
              DomHandler.addClass(target, binding.value.leaveToClass);
            }
            target.removeEventListener("animationend", target.$p_styleclass_leavelistener);
            target.$_pstyleclass_animating = false;
          };
          target.addEventListener("animationend", target.$p_styleclass_leavelistener);
        }
      } else {
        if (binding.value.leaveClass) {
          DomHandler.removeClass(target, binding.value.leaveClass);
        }
        if (binding.value.leaveFromClass) {
          DomHandler.removeClass(target, binding.value.leaveFromClass);
        }
        if (binding.value.leaveToClass) {
          DomHandler.addClass(target, binding.value.leaveToClass);
        }
      }
      if (binding.value.hideOnOutsideClick) {
        this.unbindDocumentListener(target);
      }
    },
    resolveTarget: function resolveTarget(el, binding) {
      switch (binding.value.selector) {
        case "@next":
          return el.nextElementSibling;
        case "@prev":
          return el.previousElementSibling;
        case "@parent":
          return el.parentElement;
        case "@grandparent":
          return el.parentElement.parentElement;
        default:
          return (void 0).querySelector(binding.value.selector);
      }
    },
    bindDocumentListener: function bindDocumentListener(target, el, binding) {
      var _this2 = this;
      if (!target.$p_styleclass_documentlistener) {
        target.$p_styleclass_documentlistener = function(event) {
          if (!_this2.isVisible(target) || getComputedStyle(target).getPropertyValue("position") === "static") {
            _this2.unbindDocumentListener(target);
          } else if (_this2.isOutsideClick(event, target, el)) {
            _this2.leave(target, binding);
          }
        };
        target.ownerDocument.addEventListener("click", target.$p_styleclass_documentlistener);
      }
    },
    unbindDocumentListener: function unbindDocumentListener(target) {
      if (target.$p_styleclass_documentlistener) {
        target.ownerDocument.removeEventListener("click", target.$p_styleclass_documentlistener);
        target.$p_styleclass_documentlistener = null;
      }
    },
    isVisible: function isVisible2(target) {
      return target.offsetParent !== null;
    },
    isOutsideClick: function isOutsideClick(event, target, el) {
      return !el.isSameNode(event.target) && !el.contains(event.target) && !target.contains(event.target);
    }
  }
});
var FocusTrapStyle = {};
var BaseFocusTrap = BaseDirective.extend({
  style: FocusTrapStyle
});
function _typeof$1(o) {
  "@babel/helpers - typeof";
  return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$1(o);
}
function ownKeys$1(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$1(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$1(Object(t), true).forEach(function(r2) {
      _defineProperty$1(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$1(obj, key, value) {
  key = _toPropertyKey$1(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$1(t) {
  var i = _toPrimitive$1(t, "string");
  return "symbol" == _typeof$1(i) ? i : String(i);
}
function _toPrimitive$1(t, r) {
  if ("object" != _typeof$1(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$1(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var FocusTrap = BaseFocusTrap.extend("focustrap", {
  mounted: function mounted4(el, binding) {
    var _ref = binding.value || {}, disabled = _ref.disabled;
    if (!disabled) {
      this.createHiddenFocusableElements(el, binding);
      this.bind(el, binding);
      this.autoElementFocus(el, binding);
    }
    el.setAttribute("data-pd-focustrap", true);
    this.$el = el;
  },
  updated: function updated3(el, binding) {
    var _ref2 = binding.value || {}, disabled = _ref2.disabled;
    disabled && this.unbind(el);
  },
  unmounted: function unmounted4(el) {
    this.unbind(el);
  },
  methods: {
    getComputedSelector: function getComputedSelector(selector) {
      return ':not(.p-hidden-focusable):not([data-p-hidden-focusable="true"])'.concat(selector !== null && selector !== void 0 ? selector : "");
    },
    bind: function bind2(el, binding) {
      var _this = this;
      var _ref3 = binding.value || {}, onFocusIn = _ref3.onFocusIn, onFocusOut = _ref3.onFocusOut;
      el.$_pfocustrap_mutationobserver = new MutationObserver(function(mutationList) {
        mutationList.forEach(function(mutation) {
          if (mutation.type === "childList" && !el.contains((void 0).activeElement)) {
            var findNextFocusableElement = function findNextFocusableElement2(_el) {
              var focusableElement = DomHandler.isFocusableElement(_el) ? DomHandler.isFocusableElement(_el, _this.getComputedSelector(el.$_pfocustrap_focusableselector)) ? _el : DomHandler.getFirstFocusableElement(el, _this.getComputedSelector(el.$_pfocustrap_focusableselector)) : DomHandler.getFirstFocusableElement(_el);
              return ObjectUtils.isNotEmpty(focusableElement) ? focusableElement : _el.nextSibling && findNextFocusableElement2(_el.nextSibling);
            };
            DomHandler.focus(findNextFocusableElement(mutation.nextSibling));
          }
        });
      });
      el.$_pfocustrap_mutationobserver.disconnect();
      el.$_pfocustrap_mutationobserver.observe(el, {
        childList: true
      });
      el.$_pfocustrap_focusinlistener = function(event) {
        return onFocusIn && onFocusIn(event);
      };
      el.$_pfocustrap_focusoutlistener = function(event) {
        return onFocusOut && onFocusOut(event);
      };
      el.addEventListener("focusin", el.$_pfocustrap_focusinlistener);
      el.addEventListener("focusout", el.$_pfocustrap_focusoutlistener);
    },
    unbind: function unbind2(el) {
      el.$_pfocustrap_mutationobserver && el.$_pfocustrap_mutationobserver.disconnect();
      el.$_pfocustrap_focusinlistener && el.removeEventListener("focusin", el.$_pfocustrap_focusinlistener) && (el.$_pfocustrap_focusinlistener = null);
      el.$_pfocustrap_focusoutlistener && el.removeEventListener("focusout", el.$_pfocustrap_focusoutlistener) && (el.$_pfocustrap_focusoutlistener = null);
    },
    autoFocus: function autoFocus(options) {
      this.autoElementFocus(this.$el, {
        value: _objectSpread$1(_objectSpread$1({}, options), {}, {
          autoFocus: true
        })
      });
    },
    autoElementFocus: function autoElementFocus(el, binding) {
      var _ref4 = binding.value || {}, _ref4$autoFocusSelect = _ref4.autoFocusSelector, autoFocusSelector = _ref4$autoFocusSelect === void 0 ? "" : _ref4$autoFocusSelect, _ref4$firstFocusableS = _ref4.firstFocusableSelector, firstFocusableSelector = _ref4$firstFocusableS === void 0 ? "" : _ref4$firstFocusableS, _ref4$autoFocus = _ref4.autoFocus, autoFocus2 = _ref4$autoFocus === void 0 ? false : _ref4$autoFocus;
      var focusableElement = DomHandler.getFirstFocusableElement(el, "[autofocus]".concat(this.getComputedSelector(autoFocusSelector)));
      autoFocus2 && !focusableElement && (focusableElement = DomHandler.getFirstFocusableElement(el, this.getComputedSelector(firstFocusableSelector)));
      DomHandler.focus(focusableElement);
    },
    onFirstHiddenElementFocus: function onFirstHiddenElementFocus(event) {
      var _this$$el;
      var currentTarget = event.currentTarget, relatedTarget = event.relatedTarget;
      var focusableElement = relatedTarget === currentTarget.$_pfocustrap_lasthiddenfocusableelement || !((_this$$el = this.$el) !== null && _this$$el !== void 0 && _this$$el.contains(relatedTarget)) ? DomHandler.getFirstFocusableElement(currentTarget.parentElement, this.getComputedSelector(currentTarget.$_pfocustrap_focusableselector)) : currentTarget.$_pfocustrap_lasthiddenfocusableelement;
      DomHandler.focus(focusableElement);
    },
    onLastHiddenElementFocus: function onLastHiddenElementFocus(event) {
      var _this$$el2;
      var currentTarget = event.currentTarget, relatedTarget = event.relatedTarget;
      var focusableElement = relatedTarget === currentTarget.$_pfocustrap_firsthiddenfocusableelement || !((_this$$el2 = this.$el) !== null && _this$$el2 !== void 0 && _this$$el2.contains(relatedTarget)) ? DomHandler.getLastFocusableElement(currentTarget.parentElement, this.getComputedSelector(currentTarget.$_pfocustrap_focusableselector)) : currentTarget.$_pfocustrap_firsthiddenfocusableelement;
      DomHandler.focus(focusableElement);
    },
    createHiddenFocusableElements: function createHiddenFocusableElements(el, binding) {
      var _this2 = this;
      var _ref5 = binding.value || {}, _ref5$tabIndex = _ref5.tabIndex, tabIndex = _ref5$tabIndex === void 0 ? 0 : _ref5$tabIndex, _ref5$firstFocusableS = _ref5.firstFocusableSelector, firstFocusableSelector = _ref5$firstFocusableS === void 0 ? "" : _ref5$firstFocusableS, _ref5$lastFocusableSe = _ref5.lastFocusableSelector, lastFocusableSelector = _ref5$lastFocusableSe === void 0 ? "" : _ref5$lastFocusableSe;
      var createFocusableElement = function createFocusableElement2(onFocus2) {
        return DomHandler.createElement("span", {
          "class": "p-hidden-accessible p-hidden-focusable",
          tabIndex,
          role: "presentation",
          "aria-hidden": true,
          "data-p-hidden-accessible": true,
          "data-p-hidden-focusable": true,
          onFocus: onFocus2 === null || onFocus2 === void 0 ? void 0 : onFocus2.bind(_this2)
        });
      };
      var firstFocusableElement = createFocusableElement(this.onFirstHiddenElementFocus);
      var lastFocusableElement = createFocusableElement(this.onLastHiddenElementFocus);
      firstFocusableElement.$_pfocustrap_lasthiddenfocusableelement = lastFocusableElement;
      firstFocusableElement.$_pfocustrap_focusableselector = firstFocusableSelector;
      firstFocusableElement.setAttribute("data-pc-section", "firstfocusableelement");
      lastFocusableElement.$_pfocustrap_firsthiddenfocusableelement = firstFocusableElement;
      lastFocusableElement.$_pfocustrap_focusableselector = lastFocusableSelector;
      lastFocusableElement.setAttribute("data-pc-section", "lastfocusableelement");
      el.prepend(firstFocusableElement);
      el.append(lastFocusableElement);
    }
  }
});
var BaseAnimateOnScroll = BaseDirective.extend({});
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : String(i);
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i))
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t)
          return;
        f = false;
      } else
        for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true)
          ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u))
          return;
      } finally {
        if (o)
          throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr))
    return arr;
}
var AnimateOnScroll = BaseAnimateOnScroll.extend("animateonscroll", {
  created: function created() {
    this.$value = this.$value || {};
    this.$el.style.opacity = this.$value.enterClass ? "0" : "";
  },
  mounted: function mounted5() {
    this.$el.setAttribute("data-pd-animateonscroll", true);
    this.bindIntersectionObserver();
  },
  unmounted: function unmounted5() {
    this.unbindAnimationEvents();
    this.unbindIntersectionObserver();
  },
  observer: void 0,
  resetObserver: void 0,
  isObserverActive: false,
  animationState: void 0,
  animationEndListener: void 0,
  methods: {
    bindAnimationEvents: function bindAnimationEvents() {
      var _this = this;
      if (!this.animationEndListener) {
        this.animationEndListener = function() {
          DomHandler.removeMultipleClasses(_this.$el, [_this.$value.enterClass, _this.$value.leaveClass]);
          !_this.$modifiers.once && _this.resetObserver.observe(_this.$el);
          _this.unbindAnimationEvents();
        };
        this.$el.addEventListener("animationend", this.animationEndListener);
      }
    },
    bindIntersectionObserver: function bindIntersectionObserver() {
      var _this2 = this;
      var _this$$value = this.$value, root = _this$$value.root, rootMargin = _this$$value.rootMargin, _this$$value$threshol = _this$$value.threshold, threshold = _this$$value$threshol === void 0 ? 0.5 : _this$$value$threshol;
      var options = {
        root,
        rootMargin,
        threshold
      };
      this.observer = new IntersectionObserver(function(_ref) {
        var _ref2 = _slicedToArray(_ref, 1), entry2 = _ref2[0];
        if (_this2.isObserverActive) {
          if (entry2.boundingClientRect.top > 0) {
            entry2.isIntersecting ? _this2.enter() : _this2.leave();
          }
        } else if (entry2.isIntersecting) {
          _this2.enter();
        }
        _this2.isObserverActive = true;
      }, options);
      setTimeout(function() {
        return _this2.observer.observe(_this2.$el);
      }, 0);
      this.resetObserver = new IntersectionObserver(function(_ref3) {
        var _ref4 = _slicedToArray(_ref3, 1), entry2 = _ref4[0];
        if (entry2.boundingClientRect.top > 0 && !entry2.isIntersecting) {
          _this2.$el.style.opacity = _this2.$value.enterClass ? "0" : "";
          DomHandler.removeMultipleClasses(_this2.$el, [_this2.$value.enterClass, _this2.$value.leaveClass]);
          _this2.resetObserver.unobserve(_this2.$el);
        }
        _this2.animationState = void 0;
      }, _objectSpread(_objectSpread({}, options), {}, {
        threshold: 0
      }));
    },
    enter: function enter2() {
      if (this.animationState !== "enter" && this.$value.enterClass) {
        this.$el.style.opacity = "";
        DomHandler.removeMultipleClasses(this.$el, this.$value.leaveClass);
        DomHandler.addMultipleClasses(this.$el, this.$value.enterClass);
        this.$modifiers.once && this.unbindIntersectionObserver(this.$el);
        this.bindAnimationEvents();
        this.animationState = "enter";
      }
    },
    leave: function leave2() {
      if (this.animationState !== "leave" && this.$value.leaveClass) {
        this.$el.style.opacity = this.$value.enterClass ? "0" : "";
        DomHandler.removeMultipleClasses(this.$el, this.$value.enterClass);
        DomHandler.addMultipleClasses(this.$el, this.$value.leaveClass);
        this.bindAnimationEvents();
        this.animationState = "leave";
      }
    },
    unbindAnimationEvents: function unbindAnimationEvents() {
      if (this.animationEndListener) {
        this.$el.removeEventListener("animationend", this.animationEndListener);
        this.animationEndListener = void 0;
      }
    },
    unbindIntersectionObserver: function unbindIntersectionObserver() {
      var _this$observer, _this$resetObserver;
      (_this$observer = this.observer) === null || _this$observer === void 0 || _this$observer.unobserve(this.$el);
      (_this$resetObserver = this.resetObserver) === null || _this$resetObserver === void 0 || _this$resetObserver.unobserve(this.$el);
      this.isObserverActive = false;
    }
  }
});
const accordion = {
  accordiontab: {
    root: {
      class: "mb-1"
    },
    header: ({ props }) => ({
      class: [
        // State
        { "select-none pointer-events-none cursor-default opacity-60": props == null ? void 0 : props.disabled }
      ]
    }),
    headerAction: ({ context }) => ({
      class: [
        //Font
        "font-bold",
        "leading-none",
        // Alignments
        "flex items-center",
        "relative",
        // Sizing
        "p-5",
        // Shape
        "rounded-t-md",
        { "rounded-br-md rounded-bl-md": !context.active, "rounded-br-0 rounded-bl-0": context.active },
        // Color
        "border border-surface-200 dark:border-surface-700",
        "bg-surface-50 dark:bg-surface-800",
        "text-surface-600 dark:text-surface-0/80",
        { "text-surface-900": context.active },
        // Transition
        "transition duration-200 ease-in-out",
        "transition-shadow duration-200",
        // States
        "hover:bg-surface-100 dark:hover:bg-surface-700/40",
        "hover:text-surface-900",
        "focus:outline-none focus:outline-offset-0 focus-visible:ring focus-visible:ring-primary-400/50 ring-inset dark:focus-visible:ring-primary-300/50",
        // Focus
        // Misc
        "cursor-pointer no-underline select-none"
      ]
    }),
    headerIcon: {
      class: "inline-block mr-2"
    },
    headerTitle: {
      class: "leading-none"
    },
    content: {
      class: [
        // Spacing
        "p-5",
        //Shape
        "rounded-tl-none rounded-tr-none rounded-br-lg rounded-bl-lg",
        "border-t-0",
        // Color
        "bg-surface-0 dark:bg-surface-800",
        "border border-surface-200 dark:border-surface-700",
        "text-surface-700 dark:text-surface-0/80"
      ]
    },
    transition: {
      enterFromClass: "max-h-0",
      enterActiveClass: "overflow-hidden transition-[max-height] duration-1000 ease-[cubic-bezier(0.42,0,0.58,1)]",
      enterToClass: "max-h-[1000px]",
      leaveFromClass: "max-h-[1000px]",
      leaveActiveClass: "overflow-hidden transition-[max-height] duration-[450ms] ease-[cubic-bezier(0,1,0,1)]",
      leaveToClass: "max-h-0"
    }
  }
};
const autocomplete = {
  root: ({ props }) => ({
    class: [
      "relative",
      // Flex
      "inline-flex",
      // Size
      { "w-full": props.multiple },
      // Color
      "text-surface-900 dark:text-surface-0",
      //States
      {
        "opacity-60 select-none pointer-events-none cursor-default": props.disabled
      }
    ]
  }),
  container: ({ props, state }) => ({
    class: [
      // Font
      "font-sans text-base leading-none",
      // Flex
      "flex items-center flex-wrap",
      "gap-2",
      // Spacing
      "m-0 list-none",
      "px-3 py-1.5",
      // Size
      "w-full",
      "min-h-[2.877rem]",
      // Shape
      "appearance-none rounded-md",
      // Color
      "text-surface-700 dark:text-white/80",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-700",
      // States
      "hover:border-primary-500 dark:hover:border-primary-400",
      "focus:outline-none focus:outline-offset-0",
      { "ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
      { "ring ring-primary-400/50 dark:ring-primary-300/50": state.hovered },
      // Transition
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-text overflow-hidden"
    ]
  }),
  inputtoken: {
    class: ["py-1.5 px-0", "inline-flex flex-auto"]
  },
  input: ({ props }) => ({
    class: [
      // Font
      "font-sans text-base leading-none",
      // Shape
      "appearance-none rounded-md",
      { "rounded-tr-none rounded-br-none": props.dropdown },
      { "outline-none shadow-none rounded-none": props.multiple },
      // Size
      { "w-full": props.multiple },
      // Spacing
      "m-0",
      { "p-3": !props.multiple, "p-0": props.multiple },
      // Colors
      "text-surface-700 dark:text-white/80",
      {
        "bg-surface-0 dark:bg-surface-900": !props.multiple,
        "border border-surface-300 dark:border-surface-700": !props.multiple,
        "border-0 bg-transparent": props.multiple
      },
      // States
      { "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !props.multiple },
      // Transition
      "transition-colors duration-200"
    ]
  }),
  token: {
    class: [
      // Flex
      "inline-flex items-center",
      // Spacings
      "py-1.5 px-3",
      // Shape
      "rounded-[1.14rem]",
      // Colors
      "bg-surface-200 dark:bg-surface-700",
      "text-surface-700 dark:text-white/70",
      // Misc
      "cursor-default"
    ]
  },
  label: {
    class: "leading-5"
  },
  removeTokenIcon: {
    class: [
      // Shape
      "rounded-md leading-6",
      // Spacing
      "ml-2",
      // Size
      "w-4 h-4",
      // Transition
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-pointer"
    ]
  },
  dropdownbutton: {
    root: {
      class: [
        "relative",
        // Alignments
        "items-center inline-flex text-center align-bottom",
        // Shape
        "rounded-r-md",
        // Size
        "px-4 py-3 leading-none",
        // Colors
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // States
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
      ]
    }
  },
  loadingicon: {
    class: ["text-surface-500 dark:text-surface-0/70", "absolute top-[50%] right-[0.5rem] -mt-2 animate-spin"]
  },
  panel: {
    class: [
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-white/80",
      // Shape
      "border-0",
      "rounded-md",
      "shadow-md",
      // Size
      "max-h-[200px] overflow-auto"
    ]
  },
  list: {
    class: "py-3 px-0 list-none m-0"
  },
  item: ({ context }) => ({
    class: [
      "relative",
      // Font
      "font-normal text-base leading-none",
      // Spacing
      "m-0 px-5 py-3",
      // Shape
      "border-0 rounded-none",
      // Colors
      {
        "text-surface-700 dark:text-white/80": !context.focused && !context.selected,
        "bg-surface-200 dark:bg-surface-600/60": context.focused && !context.selected,
        "text-surface-700 dark:text-white/80": context.focused && !context.selected,
        "text-primary-700 dark:text-white/80": context.focused && context.selected,
        "bg-primary-100 dark:bg-primary-400": context.focused && context.selected,
        "text-primary-700 dark:text-white/80": !context.focused && context.selected,
        "bg-primary-50 dark:bg-primary-300": !context.focused && context.selected
      },
      //States
      { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.focused && !context.selected },
      { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": context.focused && !context.selected },
      // Transition
      "transition-shadow duration-200",
      // Misc
      "cursor-pointer overflow-hidden whitespace-nowrap"
    ]
  }),
  itemgroup: {
    class: [
      "font-bold",
      // Spacing
      "m-0 p-3",
      // Colors
      "bg-surface-0 dark:bg-surface-700",
      "text-surface-800 dark:text-white/80",
      // Misc
      "cursor-auto"
    ]
  },
  emptymessage: {
    class: [
      // Font
      "leading-none",
      // Spacing
      "py-3 px-5",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-transparent"
    ]
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const avatar = {
  root: ({ props, parent }) => {
    var _a, _b, _c;
    return {
      class: [
        // Font
        {
          "text-xl": props.size == "large",
          "text-2xl": props.size == "xlarge"
        },
        // Alignments
        "inline-flex items-center justify-center",
        "relative",
        // Sizes
        {
          "h-8 w-8": props.size == null || props.size == "normal",
          "w-12 h-12": props.size == "large",
          "w-16 h-16": props.size == "xlarge"
        },
        { "-ml-4": ((_a = parent.instance.$style) == null ? void 0 : _a.name) == "avatargroup" },
        // Shapes
        {
          "rounded-lg": props.shape == "square",
          "rounded-full": props.shape == "circle"
        },
        { "border-2": ((_b = parent.instance.$style) == null ? void 0 : _b.name) == "avatargroup" },
        // Colors
        "bg-surface-300 dark:bg-surface-700",
        { "border-white dark:border-surface-800": ((_c = parent.instance.$style) == null ? void 0 : _c.name) == "avatargroup" }
      ]
    };
  },
  image: {
    class: "h-full w-full"
  }
};
const avatargroup = {
  root: {
    class: "flex items-center"
  }
};
const badge = {
  root: ({ props }) => ({
    class: [
      // Font
      "font-bold",
      {
        "text-xs leading-[1.5rem]": props.size == null,
        "text-lg leading-[2.25rem]": props.size == "large",
        "text-2xl leading-[3rem]": props.size == "xlarge"
      },
      // Alignment
      "text-center inline-block",
      // Size
      "p-0 px-1",
      {
        "min-w-[1.5rem] h-[1.5rem]": props.size == null,
        "min-w-[2.25rem] h-[2.25rem]": props.size == "large",
        "min-w-[3rem] h-[3rem]": props.size == "xlarge"
      },
      // Shape
      {
        "rounded-full": props.value.length == 1,
        "rounded-[0.71rem]": props.value.length !== 1
      },
      // Color
      "text-white dark:text-surface-900",
      {
        "bg-primary-500 dark:bg-primary-400": props.severity == null || props.severity == "primary",
        "bg-surface-500 dark:bg-surface-400": props.severity == "secondary",
        "bg-green-500 dark:bg-green-400": props.severity == "success",
        "bg-blue-500 dark:bg-blue-400": props.severity == "info",
        "bg-orange-500 dark:bg-orange-400": props.severity == "warning",
        "bg-purple-500 dark:bg-purple-400": props.severity == "help",
        "bg-red-500 dark:bg-red-400": props.severity == "danger"
      }
    ]
  })
};
const badgedirective = {
  root: ({ context }) => ({
    class: [
      // Font
      "font-bold font-sans",
      "text-xs leading-5",
      // Alignment
      "flex items-center justify-center",
      "text-center",
      // Position
      "absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 origin-top-right",
      // Size
      "m-0",
      {
        "p-0": context.nogutter || context.dot,
        "px-2": !context.nogutter && !context.dot,
        "min-w-[0.5rem] w-2 h-2": context.dot,
        "min-w-[1.5rem] h-6": !context.dot
      },
      // Shape
      {
        "rounded-full": context.nogutter || context.dot,
        "rounded-[10px]": !context.nogutter && !context.dot
      },
      // Color
      "text-white dark:text-surface-900",
      {
        "bg-primary-500 dark:bg-primary-400": !context.info && !context.success && !context.warning && !context.danger && !context.help && !context.secondary,
        "bg-surface-500 dark:bg-surface-400": context.secondary,
        "bg-green-500 dark:bg-green-400": context.success,
        "bg-blue-500 dark:bg-blue-400": context.info,
        "bg-orange-500 dark:bg-orange-400": context.warning,
        "bg-purple-500 dark:bg-purple-400": context.help,
        "bg-red-500 dark:bg-red-400": context.danger
      }
    ]
  })
};
const blockui = {
  root: {
    class: "relative"
  },
  mask: {
    class: "bg-black/40"
  }
};
const breadcrumb = {
  root: {
    class: [
      // Shape
      "rounded-md",
      // Spacing
      "p-4",
      // Color
      "bg-surface-0 dark:bg-surface-700",
      "border border-surface-200 dark:border-surface-700",
      // Misc
      "overflow-x-auto"
    ]
  },
  menu: {
    class: [
      // Flex & Alignment
      "flex items-center flex-nowrap",
      // Spacing
      "m-0 p-0 list-none leading-none"
    ]
  },
  action: {
    class: [
      // Flex & Alignment
      "flex items-center",
      // Shape
      "rounded-md",
      // Color
      "text-surface-600 dark:text-white/70",
      // States
      "focus-visible:outline-none focus-visible:outline-offset-0",
      "focus-visible:ring focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      // Transitions
      "transition-shadow duration-200",
      // Misc
      "text-decoration-none"
    ]
  },
  icon: {
    class: "text-surface-600 dark:text-white/70"
  },
  separator: {
    class: [
      // Flex & Alignment
      "flex items-center",
      // Spacing
      " mx-2",
      // Color
      "text-surface-600 dark:text-white/70"
    ]
  }
};
const button = {
  root: ({ props, context, parent }) => ({
    class: [
      "relative",
      // Alignments
      "items-center inline-flex text-center align-bottom justify-center",
      // Sizes & Spacing
      "leading-[normal]",
      {
        "px-4 py-3": props.size === null,
        "text-sm py-2 px-3": props.size === "small",
        "text-xl py-3 px-4": props.size === "large"
      },
      {
        "w-12 p-0 py-3": props.label == null && props.icon !== null
      },
      // Shapes
      { "shadow-lg": props.raised },
      { "rounded-md": !props.rounded, "rounded-full": props.rounded },
      { "rounded-none first:rounded-l-md last:rounded-r-md": parent.instance.$name == "InputGroup" },
      // Link Button
      { "text-primary-600 bg-transparent border-transparent": props.link },
      // Plain Button
      { "text-white bg-gray-500 border border-gray-500": props.plain && !props.outlined && !props.text },
      // Plain Text Button
      { "text-surface-500": props.plain && props.text },
      // Plain Outlined Button
      { "text-surface-500 border border-gray-500": props.plain && props.outlined },
      // Text Button
      { "bg-transparent border-transparent": props.text && !props.plain },
      // Outlined Button
      { "bg-transparent border": props.outlined && !props.plain },
      // --- Severity Buttons ---
      // Primary Button
      {
        "text-white dark:text-surface-900": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
        "bg-primary-500 dark:bg-primary-400": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
        "border border-primary-500 dark:border-primary-400": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain
      },
      // Primary Text Button
      { "text-primary-500 dark:text-primary-400": props.text && props.severity === null && !props.plain },
      // Primary Outlined Button
      { "text-primary-500 border border-primary-500 hover:bg-primary-300/20": props.outlined && props.severity === null && !props.plain },
      // Secondary Button
      {
        "text-white dark:text-surface-900": props.severity === "secondary" && !props.text && !props.outlined && !props.plain,
        "bg-surface-500 dark:bg-surface-400": props.severity === "secondary" && !props.text && !props.outlined && !props.plain,
        "border border-surface-500 dark:border-surface-400": props.severity === "secondary" && !props.text && !props.outlined && !props.plain
      },
      // Secondary Text Button
      { "text-surface-500 dark:text-surface-300": props.text && props.severity === "secondary" && !props.plain },
      // Secondary Outlined Button
      { "text-surface-500 dark:text-surface-300 border border-surface-500 hover:bg-surface-300/20": props.outlined && props.severity === "secondary" && !props.plain },
      // Success Button
      {
        "text-white dark:text-green-900": props.severity === "success" && !props.text && !props.outlined && !props.plain,
        "bg-green-500 dark:bg-green-400": props.severity === "success" && !props.text && !props.outlined && !props.plain,
        "border border-green-500 dark:border-green-400": props.severity === "success" && !props.text && !props.outlined && !props.plain
      },
      // Success Text Button
      { "text-green-500 dark:text-green-400": props.text && props.severity === "success" && !props.plain },
      // Success Outlined Button
      { "text-green-500 border border-green-500 hover:bg-green-300/20": props.outlined && props.severity === "success" && !props.plain },
      // Info Button
      {
        "text-white dark:text-surface-900": props.severity === "info" && !props.text && !props.outlined && !props.plain,
        "bg-blue-500 dark:bg-blue-400": props.severity === "info" && !props.text && !props.outlined && !props.plain,
        "border border-blue-500 dark:border-blue-400": props.severity === "info" && !props.text && !props.outlined && !props.plain
      },
      // Info Text Button
      { "text-blue-500 dark:text-blue-400": props.text && props.severity === "info" && !props.plain },
      // Info Outlined Button
      { "text-blue-500 border border-blue-500 hover:bg-blue-300/20 ": props.outlined && props.severity === "info" && !props.plain },
      // Warning Button
      {
        "text-white dark:text-surface-900": props.severity === "warning" && !props.text && !props.outlined && !props.plain,
        "bg-orange-500 dark:bg-orange-400": props.severity === "warning" && !props.text && !props.outlined && !props.plain,
        "border border-orange-500 dark:border-orange-400": props.severity === "warning" && !props.text && !props.outlined && !props.plain
      },
      // Warning Text Button
      { "text-orange-500 dark:text-orange-400": props.text && props.severity === "warning" && !props.plain },
      // Warning Outlined Button
      { "text-orange-500 border border-orange-500 hover:bg-orange-300/20": props.outlined && props.severity === "warning" && !props.plain },
      // Help Button
      {
        "text-white dark:text-surface-900": props.severity === "help" && !props.text && !props.outlined && !props.plain,
        "bg-purple-500 dark:bg-purple-400": props.severity === "help" && !props.text && !props.outlined && !props.plain,
        "border border-purple-500 dark:border-purple-400": props.severity === "help" && !props.text && !props.outlined && !props.plain
      },
      // Help Text Button
      { "text-purple-500 dark:text-purple-400": props.text && props.severity === "help" && !props.plain },
      // Help Outlined Button
      { "text-purple-500 border border-purple-500 hover:bg-purple-300/20": props.outlined && props.severity === "help" && !props.plain },
      // Danger Button
      {
        "text-white dark:text-surface-900": props.severity === "danger" && !props.text && !props.outlined && !props.plain,
        "bg-red-500 dark:bg-red-400": props.severity === "danger" && !props.text && !props.outlined && !props.plain,
        "border border-red-500 dark:border-red-400": props.severity === "danger" && !props.text && !props.outlined && !props.plain
      },
      // Danger Text Button
      { "text-red-500 dark:text-red-400": props.text && props.severity === "danger" && !props.plain },
      // Danger Outlined Button
      { "text-red-500 border border-red-500 hover:bg-red-300/20": props.outlined && props.severity === "danger" && !props.plain },
      // --- Severity Button States ---
      "focus:outline-none focus:outline-offset-0 focus:ring",
      // Link
      { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": props.link },
      // Plain
      { "hover:bg-gray-600 hover:border-gray-600": props.plain && !props.outlined && !props.text },
      // Text & Outlined Button
      { "hover:bg-surface-300/20": props.plain && (props.text || props.outlined) },
      // Primary
      { "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain },
      { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": props.severity === null },
      // Text & Outlined Button
      { "hover:bg-primary-300/20": (props.text || props.outlined) && props.severity === null && !props.plain },
      // Secondary
      { "hover:bg-surface-600 dark:hover:bg-surface-300 hover:border-surface-600 dark:hover:border-surface-300": props.severity === "secondary" && !props.text && !props.outlined && !props.plain },
      { "focus:ring-surface-400/50 dark:focus:ring-surface-300/50": props.severity === "secondary" },
      // Text & Outlined Button
      { "hover:bg-surface-300/20": (props.text || props.outlined) && props.severity === "secondary" && !props.plain },
      // Success
      { "hover:bg-green-600 dark:hover:bg-green-300 hover:border-green-600 dark:hover:border-green-300": props.severity === "success" && !props.text && !props.outlined && !props.plain },
      { "focus:ring-green-400/50 dark:focus:ring-green-300/50": props.severity === "success" },
      // Text & Outlined Button
      { "hover:bg-green-300/20": (props.text || props.outlined) && props.severity === "success" && !props.plain },
      // Info
      { "hover:bg-blue-600 dark:hover:bg-blue-300 hover:border-blue-600 dark:hover:border-blue-300": props.severity === "info" && !props.text && !props.outlined && !props.plain },
      { "focus:ring-blue-400/50 dark:focus:ring-blue-300/50": props.severity === "info" },
      // Text & Outlined Button
      { "hover:bg-blue-300/20": (props.text || props.outlined) && props.severity === "info" && !props.plain },
      // Warning
      { "hover:bg-orange-600 dark:hover:bg-orange-300 hover:border-orange-600 dark:hover:border-orange-300": props.severity === "warning" && !props.text && !props.outlined && !props.plain },
      { "focus:ring-orange-400/50 dark:focus:ring-orange-300/50": props.severity === "warning" },
      // Text & Outlined Button
      { "hover:bg-orange-300/20": (props.text || props.outlined) && props.severity === "warning" && !props.plain },
      // Help
      { "hover:bg-purple-600 dark:hover:bg-purple-300 hover:border-purple-600 dark:hover:border-purple-300": props.severity === "help" && !props.text && !props.outlined && !props.plain },
      { "focus:ring-purple-400/50 dark:focus:ring-purple-300/50": props.severity === "help" },
      // Text & Outlined Button
      { "hover:bg-purple-300/20": (props.text || props.outlined) && props.severity === "help" && !props.plain },
      // Danger
      { "hover:bg-red-600 dark:hover:bg-red-300 hover:border-red-600 dark:hover:border-red-300": props.severity === "danger" && !props.text && !props.outlined && !props.plain },
      { "focus:ring-red-400/50 dark:focus:ring-red-300/50": props.severity === "danger" },
      // Text & Outlined Button
      { "hover:bg-red-300/20": (props.text || props.outlined) && props.severity === "danger" && !props.plain },
      // Disabled
      { "opacity-60 pointer-events-none cursor-default": context.disabled },
      // Transitions
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-pointer overflow-hidden select-none"
    ]
  }),
  label: ({ props }) => ({
    class: [
      "duration-200",
      "font-bold",
      {
        "hover:underline": props.link
      },
      { "flex-1": props.label !== null, "invisible w-0": props.label == null }
    ]
  }),
  icon: ({ props }) => ({
    class: [
      "mx-0",
      {
        "mr-2": props.iconPos == "left" && props.label != null,
        "ml-2 order-1": props.iconPos == "right" && props.label != null,
        "mb-2": props.iconPos == "top" && props.label != null,
        "mt-2": props.iconPos == "bottom" && props.label != null
      }
    ]
  }),
  loadingicon: ({ props }) => ({
    class: [
      "h-4 w-4",
      "mx-0",
      {
        "mr-2": props.iconPos == "left" && props.label != null,
        "ml-2 order-1": props.iconPos == "right" && props.label != null,
        "mb-2": props.iconPos == "top" && props.label != null,
        "mt-2": props.iconPos == "bottom" && props.label != null
      },
      "animate-spin"
    ]
  }),
  badge: ({ props }) => ({
    class: [{ "ml-2 w-4 h-4 leading-none flex items-center justify-center": props.badge }]
  })
};
const calendar = {
  root: ({ props }) => ({
    class: [
      // Display and Position
      "inline-flex",
      "max-w-full",
      "relative",
      // Misc
      { "opacity-60 select-none pointer-events-none cursor-default": props.disabled }
    ]
  }),
  input: ({ props }) => ({
    class: [
      // Display
      "flex flex-auto",
      // Font
      "font-sans leading-none",
      // Colors
      "text-surface-600 dark:text-surface-200",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-600",
      // Spacing
      "m-0 p-3",
      // Shape
      "appearance-none",
      { "rounded-md": !props.showIcon || props.iconDisplay == "input" },
      { "rounded-l-md  flex-1 pr-9": props.showIcon && props.iconDisplay !== "input" },
      { "rounded-md flex-1 pr-9": props.showIcon && props.iconDisplay === "input" },
      // Transitions
      "transition-colors",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-400",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50"
    ]
  }),
  inputicon: {
    class: ["absolute top-[50%] -mt-2", "text-surface-600 dark:text-surface-200", "right-[.75rem]"]
  },
  dropdownbutton: {
    root: {
      class: [
        "relative",
        // Alignments
        "items-center inline-flex text-center align-bottom",
        // Shape
        "rounded-r-md",
        // Size
        "px-4 py-3 leading-none",
        // Colors
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // States
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
      ]
    }
  },
  panel: ({ props }) => ({
    class: [
      // Display & Position
      {
        absolute: !props.inline,
        "inline-block": props.inline
      },
      // Size
      { "w-auto p-2 ": !props.inline },
      { "min-w-[80vw] w-auto p-2 ": props.touchUI },
      { "p-2 min-w-full": props.inline },
      // Shape
      "border rounded-lg",
      {
        "shadow-md": !props.inline
      },
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700",
      //misc
      { "overflow-x-auto": props.inline }
    ]
  }),
  datepickerMask: {
    class: ["fixed top-0 left-0 w-full h-full", "flex items-center justify-center", "bg-black bg-opacity-90"]
  },
  header: {
    class: [
      //Font
      "font-semibold",
      // Flexbox and Alignment
      "flex items-center justify-between",
      // Spacing
      "p-2",
      "m-0",
      // Shape
      "border-b",
      "rounded-t-md",
      // Colors
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700"
    ]
  },
  previousbutton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "inline-flex items-center justify-center",
      // Size
      "w-8 h-8",
      "p-0 m-0",
      // Shape
      "rounded-full",
      // Colors
      "text-surface-600 dark:text-white/70",
      "border-0",
      "bg-transparent",
      // Transitions
      "transition-colors duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      // Misc
      "cursor-pointer overflow-hidden"
    ]
  },
  title: {
    class: [
      // Text
      "leading-8",
      "mx-auto my-0"
    ]
  },
  monthTitle: {
    class: [
      // Font
      "text-base leading-5",
      "font-semibold",
      // Colors
      "text-surface-700 dark:text-white/80",
      // Transitions
      "transition duration-200",
      // Spacing
      "p-2",
      "m-0 mr-2",
      // States
      "hover:text-primary-500 dark:hover:text-primary-400",
      // Misc
      "cursor-pointer"
    ]
  },
  yearTitle: {
    class: [
      // Font
      "text-base leading-5",
      "font-semibold",
      // Colors
      "text-surface-700 dark:text-white/80",
      // Transitions
      "transition duration-200",
      // Spacing
      "p-2",
      "m-0",
      // States
      "hover:text-primary-500 dark:hover:text-primary-400",
      // Misc
      "cursor-pointer"
    ]
  },
  nextbutton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "inline-flex items-center justify-center",
      // Size
      "w-8 h-8",
      "p-0 m-0",
      // Shape
      "rounded-full",
      // Colors
      "text-surface-600 dark:text-white/70",
      "border-0",
      "bg-transparent",
      // Transitions
      "transition-colors duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      // Misc
      "cursor-pointer overflow-hidden"
    ]
  },
  table: {
    class: [
      // Font
      "text-base leading-none",
      // Size & Shape
      "border-collapse",
      "w-full",
      // Spacing
      "m-0 my-2"
    ]
  },
  tableheadercell: {
    class: [
      // Spacing
      "p-0 md:p-2"
    ]
  },
  weekheader: {
    class: ["leading-5", "text-surface-600 dark:text-white/70", "opacity-60 cursor-default"]
  },
  weeknumber: {
    class: ["text-surface-600 dark:text-white/70", "opacity-60 cursor-default"]
  },
  weekday: {
    class: [
      // Colors
      "text-surface-500 dark:text-white/60"
    ]
  },
  day: {
    class: [
      // Spacing
      "p-0 md:p-2"
    ]
  },
  weeklabelcontainer: ({ context }) => ({
    class: [
      // Flexbox and Alignment
      "flex items-center justify-center",
      "mx-auto",
      // Shape & Size
      "w-10 h-10",
      "rounded-full",
      "border-transparent border",
      // Colors
      {
        "text-surface-600 dark:text-white/70 bg-transparent": !context.selected && !context.disabled,
        "text-primary-700 bg-primary-100": context.selected && !context.disabled
      },
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      {
        "hover:bg-surface-100 dark:hover:bg-surface-800/80": !context.selected && !context.disabled,
        "hover:bg-primary-200": context.selected && !context.disabled
      },
      {
        "opacity-60 cursor-default": context.disabled,
        "cursor-pointer": !context.disabled
      }
    ]
  }),
  daylabel: ({ context }) => ({
    class: [
      // Flexbox and Alignment
      "flex items-center justify-center",
      "mx-auto",
      // Shape & Size
      "w-10 h-10",
      "rounded-full",
      "border-transparent border",
      // Colors
      {
        "text-primary-500 dark:text-primary-400": context.date.today,
        "text-surface-600 dark:text-white/70 bg-transparent": !context.selected && !context.disabled && !context.date.today,
        "text-primary-700 bg-primary-100 dark:text-surface-0 dark:bg-primary-300/40": context.selected && !context.disabled
      },
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.selected && !context.disabled,
        "hover:bg-primary-200 dark:hover:bg-primary-200/40": context.selected && !context.disabled
      },
      {
        "opacity-60 cursor-default": context.disabled,
        "cursor-pointer": !context.disabled
      }
    ]
  }),
  monthpicker: {
    class: [
      // Spacing
      "my-2"
    ]
  },
  month: ({ context }) => ({
    class: [
      // Flexbox and Alignment
      "inline-flex items-center justify-center",
      // Size
      "w-1/3",
      "p-2",
      // Shape
      "rounded-md",
      // Colors
      {
        "text-surface-600 dark:text-white/70 bg-transparent": !context.selected && !context.disabled,
        "text-primary-700 bg-primary-100 dark:text-surface-0 dark:bg-primary-300/40": context.selected && !context.disabled
      },
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.selected && !context.disabled,
        "hover:bg-primary-200 dark:hover:bg-primary-200/40": context.selected && !context.disabled
      },
      // Misc
      "cursor-pointer"
    ]
  }),
  yearpicker: {
    class: [
      // Spacing
      "my-2"
    ]
  },
  year: ({ context }) => ({
    class: [
      // Flexbox and Alignment
      "inline-flex items-center justify-center",
      // Size
      "w-1/3",
      "p-2",
      // Shape
      "rounded-md",
      // Colors
      {
        "text-surface-600 dark:text-white/70 bg-transparent": !context.selected && !context.disabled,
        "text-primary-700 bg-primary-100 dark:text-surface-0 dark:bg-primary-300/40": context.selected && !context.disabled
      },
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.selected && !context.disabled,
        "hover:bg-primary-200 dark:hover:bg-primary-200/40": context.selected && !context.disabled
      },
      // Misc
      "cursor-pointer"
    ]
  }),
  timepicker: {
    class: [
      // Flexbox
      "flex",
      "justify-center items-center",
      // Borders
      "border-t-1",
      "border-solid border-surface-200",
      // Spacing
      "p-2"
    ]
  },
  separatorcontainer: {
    class: [
      // Flexbox and Alignment
      "flex",
      "items-center",
      "flex-col",
      // Spacing
      "px-2"
    ]
  },
  separator: {
    class: [
      // Text
      "text-xl"
    ]
  },
  hourpicker: {
    class: [
      // Flexbox and Alignment
      "flex",
      "items-center",
      "flex-col",
      // Spacing
      "px-2"
    ]
  },
  minutepicker: {
    class: [
      // Flexbox and Alignment
      "flex",
      "items-center",
      "flex-col",
      // Spacing
      "px-2"
    ]
  },
  secondPicker: {
    class: [
      // Flexbox and Alignment
      "flex",
      "items-center",
      "flex-col",
      // Spacing
      "px-2"
    ]
  },
  ampmpicker: {
    class: [
      // Flexbox and Alignment
      "flex",
      "items-center",
      "flex-col",
      // Spacing
      "px-2"
    ]
  },
  incrementbutton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "inline-flex items-center justify-center",
      // Size
      "w-8 h-8",
      "p-0 m-0",
      // Shape
      "rounded-full",
      // Colors
      "text-surface-600 dark:text-white/70",
      "border-0",
      "bg-transparent",
      // Transitions
      "transition-colors duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      // Misc
      "cursor-pointer overflow-hidden"
    ]
  },
  decrementbutton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "inline-flex items-center justify-center",
      // Size
      "w-8 h-8",
      "p-0 m-0",
      // Shape
      "rounded-full",
      // Colors
      "text-surface-600 dark:text-white/70",
      "border-0",
      "bg-transparent",
      // Transitions
      "transition-colors duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      // Misc
      "cursor-pointer overflow-hidden"
    ]
  },
  groupcontainer: {
    class: [
      // Flexbox
      "flex"
    ]
  },
  group: {
    class: [
      // Flexbox and Sizing
      "flex-1",
      // Borders
      "border-l",
      "border-surface-200",
      // Spacing
      "pr-0.5",
      "pl-0.5",
      "pt-0",
      "pb-0",
      // Pseudo-Classes
      "first:pl-0",
      "first:border-l-0"
    ]
  },
  buttonbar: {
    class: [
      // Flexbox
      "flex justify-between items-center",
      // Spacing
      "py-3 px-0",
      // Shape
      "border-t border-surface-200 dark:border-surface-700"
    ]
  },
  todaybutton: {
    root: {
      class: [
        // Flexbox and Alignment
        "inline-flex items-center justify-center",
        // Spacing
        "px-4 py-3 leading-none",
        // Shape
        "rounded-md",
        // Colors
        "bg-transparent border-transparent",
        "text-primary-500 dark:text-primary-400",
        // Transitions
        "transition-colors duration-200 ease-in-out",
        // States
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "hover:bg-primary-300/20",
        // Misc
        "cursor-pointer"
      ]
    }
  },
  clearbutton: {
    root: {
      class: [
        // Flexbox and Alignment
        "inline-flex items-center justify-center",
        // Spacing
        "px-4 py-3 leading-none",
        // Shape
        "rounded-md",
        // Colors
        "bg-transparent border-transparent",
        "text-primary-500 dark:text-primary-400",
        // Transitions
        "transition-colors duration-200 ease-in-out",
        // States
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "hover:bg-primary-300/20",
        // Misc
        "cursor-pointer"
      ]
    }
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const card = {
  root: {
    class: [
      //Shape
      "rounded-md",
      "shadow-md",
      //Color
      "bg-surface-0 dark:bg-surface-900",
      "text-surface-700 dark:text-surface-0"
    ]
  },
  body: {
    class: "p-5"
  },
  title: {
    class: "text-2xl font-bold mb-2"
  },
  subtitle: {
    class: [
      //Font
      "font-normal",
      //Spacing
      "mb-2",
      //Color
      "text-surface-600 dark:text-surface-0/60"
    ]
  },
  content: {
    class: "py-5"
    // Vertical padding.
  },
  footer: {
    class: "pt-5"
    // Top padding.
  }
};
const carousel = {
  root: {
    class: [
      // Flexbox
      "flex flex-col"
    ]
  },
  content: {
    class: [
      // Flexbox & Overflow
      "flex flex-col overflow-auto"
    ]
  },
  container: ({ props }) => ({
    class: [
      // Flexbox
      "flex",
      // Orientation
      {
        "flex-row": props.orientation !== "vertical",
        "flex-col": props.orientation == "vertical"
      }
    ]
  }),
  previousbutton: {
    class: [
      // Flexbox & Alignment
      "flex justify-center items-center self-center",
      // Sizing & Overflow
      "overflow-hidden w-8 h-8",
      // Spacing
      "mx-2",
      // Shape
      "rounded-full",
      // Border & Background
      "border-0 bg-transparent",
      // Color
      "text-surface-600",
      // Transitions
      "transition duration-200 ease-in-out"
    ]
  },
  nextbutton: {
    class: [
      // Flexbox & Alignment
      "flex justify-center items-center self-center",
      // Sizing & Overflow
      "overflow-hidden w-8 h-8",
      // Spacing
      "mx-2",
      // Shape
      "rounded-full",
      // Border & Background
      "border-0 bg-transparent",
      // Color
      "text-surface-600",
      // Transitions
      "transition duration-200 ease-in-out"
    ]
  },
  itemscontent: {
    class: [
      // Overflow & Width
      "overflow-hidden w-full"
    ]
  },
  itemscontainer: ({ props }) => ({
    class: [
      // Flexbox
      "flex",
      // Orientation & Sizing
      {
        "flex-row": props.orientation !== "vertical",
        "flex-col h-full": props.orientation == "vertical"
      }
    ]
  }),
  item: ({ props, state }) => ({
    class: [
      // Flexbox
      "flex shrink-0 grow ",
      // Width
      {
        [`w-[${100 / 10}%]`]: props.orientation !== "vertical",
        "w-full": props.orientation == "vertical"
      }
    ]
  }),
  indicators: {
    class: [
      // Flexbox & Alignment
      "flex flex-row justify-center flex-wrap"
    ]
  },
  indicator: {
    class: [
      // Spacing
      "mr-2 mb-2"
    ]
  },
  indicatorbutton: ({ context }) => ({
    class: [
      // Sizing & Shape
      "w-8 h-2 rounded-0",
      // Transitions
      "transition duration-200",
      // Focus Styles
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Color & Background
      {
        "bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600": !context.highlighted,
        "bg-primary-500 hover:bg-primary-600": context.highlighted
      }
    ]
  })
};
const cascadeselect = {
  root: ({ props, state }) => ({
    class: [
      // Display and Position
      "inline-flex",
      "relative",
      // Shape
      "rounded-md",
      // Color and Background
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-700",
      // Transitions
      "transition-all",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-300",
      { "outline-none outline-offset-0 ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
      // Misc
      "cursor-pointer",
      "select-none",
      { "opacity-60": props.disabled, "pointer-events-none": props.disabled, "cursor-default": props.disabled }
    ]
  }),
  label: ({ props }) => ({
    class: [
      //Font
      "font-sans",
      "leading-none",
      // Flex & Alignment
      " flex flex-auto",
      // Sizing and Spacing
      "w-[1%]",
      "p-3",
      //Shape
      "rounded-none",
      // Color and Background
      "bg-transparent",
      "border-0",
      { "text-surface-800 dark:text-white/80": props.modelValue, "text-surface-400 dark:text-surface-500": !props.modelValue },
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      // Transitions
      "transition",
      "duration-200",
      // States
      "focus:outline-none focus:shadow-none",
      // Misc
      "relative",
      "cursor-pointer",
      "overflow-hidden overflow-ellipsis",
      "whitespace-nowrap",
      "appearance-none"
    ]
  }),
  dropdownbutton: {
    class: [
      // Flexbox
      "flex items-center justify-center",
      "shrink-0",
      // Color and Background
      "bg-transparent",
      "text-surface-500",
      // Size
      "w-12",
      // Shape
      "rounded-tr-md",
      "rounded-br-md"
    ]
  },
  panel: {
    class: [
      // Position
      "absolute top-0 left-0",
      // Shape
      "border-0 dark:border",
      "rounded-md",
      "shadow-md",
      // Color
      "bg-surface-0 dark:bg-surface-700",
      "text-surface-800 dark:text-white/80",
      "dark:border-surface-700"
    ]
  },
  wrapper: {
    class: [
      // Sizing
      "max-h-[200px]",
      // Misc
      "overflow-auto"
    ]
  },
  list: {
    class: "py-3 list-none m-0"
  },
  item: ({ context }) => ({
    class: [
      // Font
      "font-normal",
      "leading-none",
      // Shape
      "border-0",
      "rounded-none",
      // Spacing
      "m-0",
      //  Colors
      {
        "text-surface-500 dark:text-white/70": !context.focused && !context.active,
        "text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-surface-600/90": context.focused && !context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": context.focused && context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": !context.focused && context.active
      },
      // Hover States
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.active,
        "hover:bg-primary-500/50 dark:hover:bg-primary-300/30 text-primary-700 dark:text-surface-0/80": context.active
      },
      // Transitions
      "transition-shadow",
      "duration-200",
      // Misc
      "cursor-pointer",
      "overflow-hidden",
      "whitespace-nowrap"
    ]
  }),
  content: {
    class: [
      "relative",
      // Flexbox
      "flex",
      "items-center",
      // Spacing
      "py-3",
      "px-5",
      // Misc
      "no-underline",
      "overflow-hidden",
      "cursor-pointer",
      "select-none"
    ]
  },
  groupicon: {
    class: [
      // Alignment
      "ml-auto"
    ]
  },
  sublist: {
    class: [
      // Size
      "w-full",
      // Spacing
      "py-1",
      "m-0",
      "list-none",
      // Shape
      "shadow-none sm:shadow-md",
      "border-0",
      // Position
      "static sm:absolute",
      "z-10",
      // Color
      "bg-surface-0 dark:bg-surface-700"
    ]
  },
  separator: {
    class: "border-t border-surface-200 dark:border-surface-600 my-1"
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const checkbox = {
  root: {
    class: [
      "relative",
      // Alignment
      "inline-flex",
      "align-bottom",
      // Size
      "w-6",
      "h-6",
      // Misc
      "cursor-pointer",
      "select-none"
    ]
  },
  box: ({ props, context }) => ({
    class: [
      // Alignment
      "flex",
      "items-center",
      "justify-center",
      // Size
      "w-6",
      "h-6",
      // Shape
      "rounded-md",
      "border-2",
      // Colors
      {
        "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
        "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
      },
      // States
      {
        "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
        "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
        "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
        "cursor-default opacity-60": props.disabled
      },
      // Transitions
      "transition-colors",
      "duration-200"
    ]
  }),
  input: {
    class: [
      "peer",
      // Size
      "w-full ",
      "h-full",
      // Position
      "absolute",
      "top-0 left-0",
      "z-10",
      // Spacing
      "p-0",
      "m-0",
      // Shape
      "opacity-0",
      "rounded-md",
      "outline-none",
      "border-2 border-surface-200 dark:border-surface-700",
      // Misc
      "appareance-none",
      "cursor-pointer"
    ]
  },
  icon: {
    class: [
      // Font
      "text-base leading-none",
      // Size
      "w-4",
      "h-4",
      // Colors
      "text-white dark:text-surface-900",
      // Transitions
      "transition-all",
      "duration-200"
    ]
  }
};
const chip = {
  root: {
    class: [
      // Flexbox
      "inline-flex items-center",
      // Spacing
      "px-3",
      // Shape
      "rounded-[1.14rem]",
      // Colors
      "text-surface-700 dark:text-white/70",
      "bg-surface-200 dark:bg-surface-700"
    ]
  },
  label: {
    class: "leading-6 my-1.5 mx-0"
  },
  icon: {
    class: "leading-6 mr-2"
  },
  image: {
    class: ["w-9 h-9 -ml-3 mr-2", "rounded-full"]
  },
  removeIcon: {
    class: [
      // Shape
      "rounded-md leading-6",
      // Spacing
      "ml-2",
      // Size
      "w-4 h-4",
      // Transition
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-pointer"
    ]
  }
};
const chips = {
  root: ({ props }) => ({
    class: [
      "flex",
      {
        "opacity-60 select-none pointer-events-none cursor-default": props.disabled
      }
    ]
  }),
  container: ({ state }) => ({
    class: [
      // Font
      "font-sans text-base leading-none",
      // Flex
      "flex items-center flex-wrap gap-2",
      // Spacing
      "m-0 py-1.5 px-3",
      // Size
      "w-full",
      "min-h-[2.877rem]",
      // Shape
      "list-none",
      "rounded-md",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-700",
      // States
      "hover:border-primary-500 dark:hover:border-primary-400",
      "focus:outline-none focus:outline-offset-0",
      { "ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
      { "ring ring-primary-400/50 dark:ring-primary-300/50": state.hovered },
      // Transition
      "transition-colors duration-200",
      // Misc
      "cursor-text overflow-hidden",
      "appearance-none"
    ]
  }),
  inputtoken: {
    class: ["py-1.5 px-0", "inline-flex flex-auto"]
  },
  input: {
    class: [
      // Font
      "font-sans text-base leading-[1.2]",
      // Size
      "w-full",
      // Spacing
      "p-0 m-0",
      // Shape
      "appearance-none rounded-none",
      "border-0 outline-none",
      "shadow-none",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-transparent"
    ]
  },
  token: {
    class: [
      // Flexbox
      "inline-flex items-center",
      // Spacing
      "py-1.5 px-3",
      // Shape
      "rounded-[1.14rem]",
      // Colors
      "text-surface-700 dark:text-white/70",
      "bg-surface-200 dark:bg-surface-700"
    ]
  },
  label: {
    class: "leading-5"
  },
  removeTokenIcon: {
    class: [
      // Shape
      "rounded-md leading-6",
      // Spacing
      "ml-2",
      // Size
      "w-4 h-4",
      // Transition
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-pointer"
    ]
  }
};
const colorpicker = {
  root: ({ props }) => ({
    class: [
      // Display
      "inline-block",
      // Misc
      { "opacity-60 select-none pointer-events-none cursor-default": props.disabled }
    ]
  }),
  input: {
    class: [
      // Font
      "font-sans text-base ",
      // Spacing
      "m-0",
      "p-3",
      // Size & Shape
      "rounded-lg w-8 h-8",
      // Colors
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-700",
      // States
      "hover:border-primary-500 dark:hover:border-primary-400",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transition
      "transition-colors duration-200",
      // Misc
      "cursor-pointer"
    ]
  },
  panel: ({ props }) => ({
    class: [
      // Position & Size
      {
        "relative h-[166px] w-[193px]": props.inline,
        "absolute h-[166px] w-[193px]": !props.inline
      },
      // Shape
      "shadow-md border",
      // Colors
      "bg-surface-800 border-surface-900 dark:border-surface-600"
    ]
  }),
  selector: {
    class: [
      // Position
      "absolute top-[8px] left-[8px]",
      // Size
      "h-[150px] w-[150px]"
    ]
  },
  color: {
    class: [
      // Size
      "h-[150px] w-[150px]"
    ],
    style: "background: linear-gradient(to top, #000 0%, rgb(0 0 0 / 0) 100%), linear-gradient(to right, #fff 0%, rgb(255 255 255 / 0) 100%)"
  },
  colorhandle: {
    class: [
      "absolute",
      // Shape
      "rounded-full border border-solid",
      // Size
      "h-[10px] w-[10px]",
      // Spacing
      "-ml-[5px] -mt-[5px]",
      // Colors
      "border-white",
      // Misc
      "cursor-pointer opacity-85"
    ]
  },
  hue: {
    class: [
      // Position
      "absolute top-[8px] left-[167px]",
      // Size
      "h-[150px] w-[17px]",
      // Opacity
      "opacity-85"
    ],
    style: "background: linear-gradient(0deg, red 0, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, red)"
  },
  huehandle: {
    class: [
      // Position
      "absolute left-0 -ml-[2px] -mt-[5px]",
      // Size
      "h-[10px] w-[21px]",
      // Shape
      "border-solid border-2",
      // Misc
      "cursor-pointer opacity-85"
    ]
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const confirmpopup = {
  root: {
    class: [
      // Shape
      "rounded-lg",
      "shadow-lg",
      "border-0",
      // Positioning
      "z-40 transform origin-center",
      "mt-3 absolute left-0 top-0",
      // Color
      "dark:border",
      "dark:border-surface-700",
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-surface-0/80",
      // Before: Arrow
      "before:absolute before:w-0 before:-top-3 before:h-0 before:border-transparent before:border-solid before:ml-6 before:border-x-[0.75rem] before:border-b-[0.75rem] before:border-t-0 before:border-b-surface-0 dark:before:border-b-surface-800"
    ]
  },
  content: {
    class: "p-5 items-center flex"
  },
  icon: {
    class: "text-2xl mr-4"
  },
  footer: {
    class: [
      // Flexbox and Alignment
      "flex items-center justify-end",
      "shrink-0",
      "text-right",
      "gap-2",
      // Spacing
      "px-6",
      "pb-6",
      // Shape
      "border-t-0",
      "rounded-b-lg",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-surface-0/80"
    ]
  },
  rejectbutton: {
    root: {
      class: [
        "relative",
        // Alignments
        "items-center inline-flex text-center align-bottom justify-center",
        // Sizes & Spacing
        "px-4 py-3 leading-none",
        // Shape
        "rounded-md",
        // Color
        "text-primary-500 dark:text-primary-400",
        // States
        "hover:bg-primary-300/20",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
      ]
    }
  },
  acceptbutton: {
    root: {
      class: [
        "relative",
        // Alignments
        "items-center inline-flex text-center align-bottom justify-center",
        // Sizes & Spacing
        "px-4 py-3 leading-none",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // States
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
      ]
    }
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const contextmenu = {
  root: {
    class: [
      // Sizing and Shape
      "min-w-[12rem]",
      "rounded-md",
      "shadow-md",
      // Spacing
      "py-2",
      // Colors
      "bg-surface-0 dark:bg-surface-700",
      "text-surface-700 dark:text-white/80",
      "dark:border dark:border-surface-700"
    ]
  },
  menu: {
    class: [
      // Spacings and Shape
      "list-none",
      "m-0",
      "p-0",
      "outline-none"
    ]
  },
  menuitem: {
    class: "relative"
  },
  content: ({ context }) => ({
    class: [
      //Shape
      "rounded-none",
      // Colors
      "text-surface-700 dark:text-white/80",
      {
        "text-surface-500 dark:text-white/70": !context.focused && !context.active,
        "text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-surface-600/90": context.focused && !context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": context.focused && context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": !context.focused && context.active
      },
      // Transitions
      "transition-shadow",
      "duration-200",
      // States
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.active,
        "hover:bg-primary-400/30 dark:hover:bg-primary-300/30 text-primary-700 dark:text-surface-0/80": context.active
      }
    ]
  }),
  action: {
    class: [
      "relative",
      // Flexbox
      "flex",
      "items-center",
      // Spacing
      "py-3",
      "px-5",
      // Color
      "text-surface-700 dark:text-white/80",
      // Misc
      "no-underline",
      "overflow-hidden",
      "cursor-pointer",
      "select-none"
    ]
  },
  icon: {
    class: [
      // Spacing
      "mr-2",
      // Color
      "text-surface-600 dark:text-white/70"
    ]
  },
  label: {
    class: ["leading-none"]
  },
  submenu: ({ props }) => ({
    class: [
      // Size
      "w-full sm:w-48",
      // Spacing
      "py-1",
      "m-0",
      "list-none",
      // Shape
      "shadow-md",
      "rounded-md",
      "dark:border dark:border-surface-700",
      // Position
      "static sm:absolute",
      "z-10",
      { "sm:absolute sm:left-full sm:top-0": props.level > 1 },
      // Color
      "bg-surface-0 dark:bg-surface-700"
    ]
  }),
  submenuicon: {
    class: ["ml-auto"]
  },
  separator: {
    class: "border-t border-surface-200 dark:border-surface-600 my-1"
  },
  transition: {
    enterFromClass: "opacity-0",
    enterActiveClass: "transition-opacity duration-250"
  }
};
const datatable = {
  root: ({ props }) => ({
    class: [
      "relative",
      // Flex & Alignment
      { "flex flex-col": props.scrollable && props.scrollHeight === "flex" },
      // Size
      { "h-full": props.scrollable && props.scrollHeight === "flex" }
    ]
  }),
  loadingoverlay: {
    class: [
      // Position
      "absolute",
      "top-0 left-0",
      "z-20",
      // Flex & Alignment
      "flex items-center justify-center",
      // Size
      "w-full h-full",
      // Color
      "bg-surface-100/40 dark:bg-surface-800/40",
      // Transition
      "transition duration-200"
    ]
  },
  loadingicon: {
    class: "w-8 h-8 animate-spin"
  },
  wrapper: ({ props }) => ({
    class: [
      { relative: props.scrollable, "flex flex-col grow": props.scrollable && props.scrollHeight === "flex" },
      // Size
      { "h-full": props.scrollable && props.scrollHeight === "flex" }
    ]
  }),
  header: ({ props }) => ({
    class: [
      "font-bold",
      // Shape
      props.showGridlines ? "border-x border-t border-b-0" : "border-y border-x-0",
      // Spacing
      "p-4",
      // Color
      "bg-surface-50 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700",
      "text-surface-700 dark:text-white/80"
    ]
  }),
  table: {
    class: "w-full border-spacing-0 border-separate"
  },
  thead: ({ context }) => ({
    class: [
      {
        "bg-surface-50 top-0 z-40 sticky": context.scrollable
      }
    ]
  }),
  tbody: ({ instance, context }) => ({
    class: [
      {
        "sticky z-20": instance.frozenRow && context.scrollable
      }
    ]
  }),
  tfoot: ({ context }) => ({
    class: [
      {
        "bg-surface-50 bottom-0 z-0": context.scrollable
      }
    ]
  }),
  footer: {
    class: [
      "font-bold",
      // Shape
      "border-t-0 border-b border-x-0",
      // Spacing
      "p-4",
      // Color
      "bg-surface-50 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700",
      "text-surface-700 dark:text-white/80"
    ]
  },
  column: {
    headercell: ({ context, props }) => ({
      class: [
        "font-bold",
        // Position
        { "sticky z-20 border-b": props.frozen || props.frozen === "" },
        { relative: context.resizable },
        // Alignment
        "text-left",
        // Shape
        { "first:border-l border-y border-r": context == null ? void 0 : context.showGridlines },
        "border-0 border-b border-solid",
        // Spacing
        (context == null ? void 0 : context.size) === "small" ? "p-2" : (context == null ? void 0 : context.size) === "large" ? "p-5" : "p-4",
        // Color
        (props.sortable === "" || props.sortable) && context.sorted ? "bg-primary-50 text-primary-700" : "bg-surface-50 text-surface-700",
        (props.sortable === "" || props.sortable) && context.sorted ? "dark:text-white dark:bg-primary-400/30" : "dark:text-white/80 dark:bg-surface-800",
        "border-surface-200 dark:border-surface-700 ",
        // States
        { "hover:bg-surface-100 dark:hover:bg-surface-400/30": (props.sortable === "" || props.sortable) && !(context == null ? void 0 : context.sorted) },
        "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
        // Transition
        { "transition duration-200": props.sortable === "" || props.sortable },
        // Misc
        { "cursor-pointer": props.sortable === "" || props.sortable },
        {
          "overflow-hidden space-nowrap border-y bg-clip-padding": context.resizable
          // Resizable
        }
      ]
    }),
    headercontent: {
      class: "flex items-center"
    },
    sort: ({ context }) => ({
      class: [context.sorted ? "text-primary-500" : "text-surface-700", context.sorted ? "dark:text-primary-400" : "dark:text-white/80"]
    }),
    bodycell: ({ props, context, state, parent }) => ({
      class: [
        //Position
        { "sticky box-border border-b": parent.instance.frozenRow },
        { "sticky box-border border-b": props.frozen || props.frozen === "" },
        // Alignment
        "text-left",
        // Shape
        "border-0 border-b border-solid",
        { "first:border-l border-r border-b": context == null ? void 0 : context.showGridlines },
        { "bg-surface-0 dark:bg-surface-800": parent.instance.frozenRow || props.frozen || props.frozen === "" },
        // Spacing
        { "p-2": (context == null ? void 0 : context.size) === "small" && !state["d_editing"] },
        { "p-5": (context == null ? void 0 : context.size) === "large" && !state["d_editing"] },
        { "p-4": (context == null ? void 0 : context.size) !== "large" && (context == null ? void 0 : context.size) !== "small" && !state["d_editing"] },
        { "py-[0.6rem] px-2": state["d_editing"] },
        // Color
        "border-surface-200 dark:border-surface-700"
      ]
    }),
    footercell: ({ context }) => ({
      class: [
        // Font
        "font-bold",
        // Alignment
        "text-left",
        // Shape
        "border-0 border-b border-solid",
        { "border-x border-y": context == null ? void 0 : context.showGridlines },
        // Spacing
        (context == null ? void 0 : context.size) === "small" ? "p-2" : (context == null ? void 0 : context.size) === "large" ? "p-5" : "p-4",
        // Color
        "border-surface-200 dark:border-surface-700",
        "text-surface-700 dark:text-white/80",
        "bg-surface-50 dark:bg-surface-800"
      ]
    }),
    sorticon: ({ context }) => ({
      class: ["ml-2", context.sorted ? "text-primary-700 dark:text-white/80" : "text-surface-700 dark:text-white/70"]
    }),
    sortbadge: {
      class: [
        // Flex & Alignment
        "flex items-center justify-center align-middle",
        // Shape
        "rounded-full",
        // Size
        "w-[1.143rem] leading-[1.143rem]",
        // Spacing
        "ml-2",
        // Color
        "text-primary-700 dark:text-white",
        "bg-primary-50 dark:bg-primary-400/30"
      ]
    },
    columnfilter: {
      class: "inline-flex items-center ml-auto"
    },
    filteroverlay: {
      class: [
        // Position
        "absolute top-0 left-0",
        // Shape
        "border-0 dark:border",
        "rounded-md",
        "shadow-md",
        // Size
        "min-w-[12.5rem]",
        // Color
        "bg-surface-0 dark:bg-surface-800",
        "text-surface-800 dark:text-white/80",
        "dark:border-surface-700"
      ]
    },
    filtermatchmodedropdown: {
      root: ({ state }) => ({
        class: [
          // Display and Position
          "flex",
          "relative",
          // Spacing
          "my-2",
          // Shape
          "w-full",
          "rounded-md",
          // Color and Background
          "bg-surface-0 dark:bg-surface-900",
          "border border-surface-300 dark:border-surface-700",
          "text-surface-800 dark:text-white/80",
          "placeholder:text-surface-400 dark:placeholder:text-surface-500",
          // Transitions
          "transition-all",
          "duration-200",
          // States
          "hover:border-primary-500 dark:hover:border-primary-300",
          { "outline-none outline-offset-0 ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
          // Misc
          "cursor-pointer",
          "select-none"
        ]
      })
    },
    filterrowitems: {
      class: "m-0 p-0 py-3 list-none"
    },
    filterrowitem: ({ context }) => ({
      class: [
        // Font
        "font-normal",
        "leading-none",
        // Position
        "relative",
        // Shape
        "border-0",
        "rounded-none",
        // Spacing
        "m-0",
        "py-3 px-5",
        // Color
        { "text-surface-700 dark:text-white/80": !(context == null ? void 0 : context.highlighted) },
        { "bg-surface-0 dark:bg-surface-800 text-surface-700 dark:text-white/80": !(context == null ? void 0 : context.highlighted) },
        { "bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context == null ? void 0 : context.highlighted },
        { "bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context == null ? void 0 : context.highlighted },
        //States
        { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !(context == null ? void 0 : context.highlighted) },
        { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": !(context == null ? void 0 : context.highlighted) },
        "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
        // Transitions
        "transition-shadow",
        "duration-200",
        // Misc
        "cursor-pointer",
        "overflow-hidden",
        "whitespace-nowrap"
      ]
    }),
    filteroperator: {
      class: [
        // Spacing
        "px-5 py-3",
        // Shape
        "border-b border-solid",
        "rounded-t-md",
        // Color
        "text-surface-700 dark:text-white/80",
        "border-surface-200 dark:border-surface-800",
        "bg-surface-0 dark:bg-surface-700"
      ]
    },
    filteroperatordropdown: {
      root: ({ state }) => ({
        class: [
          // Display and Position
          "inline-flex",
          "relative",
          // Shape
          "w-full",
          "rounded-md",
          // Color and Background
          "bg-surface-0 dark:bg-surface-900",
          "border border-surface-300 dark:border-surface-700",
          // Transitions
          "transition-all",
          "duration-200",
          // States
          "hover:border-primary-500 dark:hover:border-primary-300",
          { "outline-none outline-offset-0 ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
          // Misc
          "cursor-pointer",
          "select-none"
        ]
      }),
      input: ({ props }) => ({
        class: [
          //Font
          "font-sans",
          "leading-none",
          // Display
          "block",
          "flex-auto",
          // Color and Background
          "bg-transparent",
          "border-0",
          { "text-surface-800 dark:text-white/80": props.modelValue, "text-surface-400 dark:text-surface-500": !props.modelValue },
          "placeholder:text-surface-400 dark:placeholder:text-surface-500",
          // Sizing and Spacing
          "w-[1%]",
          "p-3",
          //Shape
          "rounded-none",
          // Transitions
          "transition",
          "duration-200",
          // States
          "focus:outline-none focus:shadow-none",
          // Misc
          "relative",
          "cursor-pointer",
          "overflow-hidden overflow-ellipsis",
          "whitespace-nowrap",
          "appearance-none"
        ]
      }),
      trigger: {
        class: [
          // Flexbox
          "flex items-center justify-center",
          "shrink-0",
          // Color and Background
          "bg-transparent",
          "text-surface-500",
          // Size
          "w-12",
          // Shape
          "rounded-tr-md",
          "rounded-br-md"
        ]
      },
      panel: {
        class: [
          // Position
          "absolute top-0 left-0",
          // Shape
          "border-0 dark:border",
          "rounded-md",
          "shadow-md",
          // Color
          "bg-surface-0 dark:bg-surface-800",
          "text-surface-800 dark:text-white/80",
          "dark:border-surface-700"
        ]
      },
      item: ({ context }) => ({
        class: [
          // Font
          "font-normal",
          "leading-none",
          // Position
          "relative",
          // Shape
          "border-0",
          "rounded-none",
          // Spacing
          "m-0",
          "py-3 px-5",
          // Color
          { "text-surface-700 dark:text-white/80": !context.focused && !context.selected },
          { "bg-surface-50 dark:bg-surface-600/60 text-surface-700 dark:text-white/80": context.focused && !context.selected },
          { "bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context.focused && context.selected },
          { "bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": !context.focused && context.selected },
          //States
          { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.focused && !context.selected },
          { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": context.focused && !context.selected },
          // Transitions
          "transition-shadow",
          "duration-200",
          // Misc
          "cursor-pointer",
          "overflow-hidden",
          "whitespace-nowrap"
        ]
      })
    },
    filterconstraint: {
      class: [
        // Spacing
        "py-3 px-5",
        // Shape
        "border-b border-solid",
        // Color
        "border-surface-200 dark:border-surface-700"
      ]
    },
    filteraddrule: {
      class: "py-3 px-5"
    },
    filteraddrulebutton: {
      root: {
        class: [
          "relative",
          // Alignments
          "items-center inline-flex text-center align-bottom justify-center",
          // Sizes & Spacing
          "text-sm py-2 px-3 w-full",
          // Shape
          "rounded-md",
          "bg-transparent border-transparent",
          "text-primary-500 dark:text-primary-400",
          "hover:bg-primary-300/20",
          // Transitions
          "transition duration-200 ease-in-out",
          // Misc
          "cursor-pointer overflow-hidden select-none"
        ]
      },
      label: {
        class: "flex-auto grow-0"
      },
      icon: {
        class: "mr-2"
      }
    },
    filterremovebutton: {
      root: {
        class: [
          "relative",
          // Alignments
          "items-center inline-flex text-center align-bottom justify-center",
          // Sizes & Spacing
          "text-sm py-2 px-3 w-full mt-2",
          // Shape
          "rounded-md",
          "bg-transparent border-transparent",
          "text-red-500 dark:text-red-400",
          "hover:bg-red-300/20",
          // Transitions
          "transition duration-200 ease-in-out",
          // Misc
          "cursor-pointer overflow-hidden select-none"
        ]
      },
      label: {
        class: "flex-auto grow-0"
      },
      icon: {
        class: "mr-2"
      }
    },
    filterbuttonbar: {
      class: [
        // Flex & Alignment
        "flex items-center justify-between",
        // Space
        "py-3 px-5"
      ]
    },
    filterclearbutton: {
      root: {
        class: [
          "relative",
          // Alignments
          "items-center inline-flex text-center align-bottom justify-center",
          // Sizes & Spacing
          "text-sm py-2 px-3",
          // Shape
          "rounded-md",
          "text-primary-500 border border-primary-500",
          "hover:bg-primary-300/20",
          // Transitions
          "transition duration-200 ease-in-out",
          // Misc
          "cursor-pointer overflow-hidden select-none"
        ]
      }
    },
    filterapplybutton: {
      root: {
        class: [
          "relative",
          // Alignments
          "items-center inline-flex text-center align-bottom justify-center",
          // Sizes & Spacing
          "text-sm py-2 px-3",
          // Shape
          "rounded-md",
          "text-white dark:text-surface-900",
          "bg-primary-500 dark:bg-primary-400",
          "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
          // Transitions
          "transition duration-200 ease-in-out",
          // Misc
          "cursor-pointer overflow-hidden select-none"
        ]
      }
    },
    filtermenubutton: ({ context }) => ({
      class: [
        "relative",
        // Flex & Alignment
        "inline-flex items-center justify-center",
        // Size
        "w-8 h-8",
        // Spacing
        "ml-2",
        // Shape
        "rounded-full",
        // Color
        { "bg-primary-50 text-primary-700": context.active },
        "dark:text-white/70 dark:hover:text-white/80 dark:bg-surface-800",
        // States
        "hover:text-surface-700 hover:bg-surface-300/20",
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        // Transition
        "transition duration-200",
        // Misc
        "cursor-pointer no-underline overflow-hidden"
      ]
    }),
    headerfilterclearbutton: ({ context }) => ({
      class: [
        "relative",
        // Flex & Alignment
        "inline-flex items-center justify-center",
        "text-left",
        // Shape
        "border-none",
        // Spacing
        "m-0 p-0 ml-2",
        // Color
        "bg-transparent",
        // Misc
        "cursor-pointer no-underline overflow-hidden select-none",
        {
          invisible: !context.hidden
        }
      ]
    }),
    rowtoggler: {
      class: [
        "relative",
        // Flex & Alignment
        "inline-flex items-center justify-center",
        "text-left",
        // Spacing
        "m-0 p-0",
        // Size
        "w-8 h-8",
        // Shape
        "border-0 rounded-full",
        // Color
        "text-surface-500 dark:text-white/70",
        "bg-transparent",
        "focus-visible:outline-none focus-visible:outline-offset-0",
        "focus-visible:ring focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
        // Transition
        "transition duration-200",
        // Misc
        "overflow-hidden",
        "cursor-pointer select-none"
      ]
    },
    columnresizer: {
      class: [
        "block",
        // Position
        "absolute top-0 right-0",
        // Sizing
        "w-2 h-full",
        // Spacing
        "m-0 p-0",
        // Color
        "border border-transparent",
        // Misc
        "cursor-col-resize"
      ]
    },
    rowreordericon: {
      class: "cursor-move"
    },
    roweditorinitbutton: {
      class: [
        "relative",
        // Flex & Alignment
        "inline-flex items-center justify-center",
        "text-left",
        // Size
        "w-8 h-8",
        // Shape
        "border-0 rounded-full",
        // Color
        "text-surface-700 dark:text-white/70",
        "border-transparent",
        // States
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        "hover:text-surface-700 hover:bg-surface-300/20",
        // Transition
        "transition duration-200",
        // Misc
        "overflow-hidden",
        "cursor-pointer select-none"
      ]
    },
    roweditorsavebutton: {
      class: [
        "relative",
        // Flex & Alignment
        "inline-flex items-center justify-center",
        "text-left",
        // Size
        "w-8 h-8",
        // Shape
        "border-0 rounded-full",
        // Color
        "text-surface-700 dark:text-white/70",
        "border-transparent",
        // States
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        "hover:text-surface-700 hover:bg-surface-300/20",
        // Transition
        "transition duration-200",
        // Misc
        "overflow-hidden",
        "cursor-pointer select-none"
      ]
    },
    roweditorcancelbutton: {
      class: [
        "relative",
        // Flex & Alignment
        "inline-flex items-center justify-center",
        "text-left",
        // Size
        "w-8 h-8",
        // Shape
        "border-0 rounded-full",
        // Color
        "text-surface-700 dark:text-white/70",
        "border-transparent",
        // States
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        "hover:text-surface-700 hover:bg-surface-300/20",
        // Transition
        "transition duration-200",
        // Misc
        "overflow-hidden",
        "cursor-pointer select-none"
      ]
    },
    rowRadiobutton: {
      root: {
        class: [
          "relative",
          // Flexbox & Alignment
          "inline-flex",
          "align-bottom",
          // Size
          "w-[1.571rem] h-[1.571rem]",
          // Misc
          "cursor-pointer",
          "select-none"
        ]
      },
      box: ({ props }) => ({
        class: [
          // Flexbox
          "flex justify-center items-center",
          // Size
          "w-[1.571rem] h-[1.571rem]",
          // Shape
          "border-2",
          "rounded-full",
          // Transition
          "transition duration-200 ease-in-out",
          // Colors
          {
            "text-surface-700 dark:text-white/80": !props.modelValue,
            "bg-surface-0 dark:bg-surface-900": !props.modelValue,
            "border-surface-300 dark:border-surface-700": !props.modelValue,
            "border-primary-500 dark:border-primary-400": props.modelValue,
            "bg-primary-500 dark:bg-primary-400": props.modelValue
          },
          // States
          {
            "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled,
            "peer-hover:border-primary-600 dark:peer-hover:border-primary-300 peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300": !props.disabled && props.modelValue,
            "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
            "opacity-60 cursor-default": props.disabled
          }
        ]
      }),
      input: {
        class: [
          "peer",
          // Size
          "w-full ",
          "h-full",
          // Position
          "absolute",
          "top-0 left-0",
          "z-10",
          // Spacing
          "p-0",
          "m-0",
          // Shape
          "opacity-0",
          "rounded-md",
          "outline-none",
          "border-2 border-surface-200 dark:border-surface-700",
          // Misc
          "appareance-none",
          "cursor-pointer"
        ]
      },
      icon: ({ props }) => ({
        class: [
          "block",
          // Shape
          "rounded-full",
          // Size
          "w-[0.857rem] h-[0.857rem]",
          // Colors
          "bg-surface-0 dark:bg-surface-900",
          // Conditions
          {
            "backface-hidden scale-10 invisible": !props.modelValue,
            "transform visible scale-[1.1]": props.modelValue
          },
          // Transition
          "transition duration-200"
        ]
      })
    },
    headercheckbox: {
      root: {
        class: [
          "relative",
          // Alignment
          "inline-flex",
          "align-bottom",
          // Size
          "w-6",
          "h-6",
          // Misc
          "cursor-pointer",
          "select-none"
        ]
      },
      box: ({ props, context }) => ({
        class: [
          // Alignment
          "flex",
          "items-center",
          "justify-center",
          // Size
          "w-6",
          "h-6",
          // Shape
          "rounded-md",
          "border-2",
          // Colors
          {
            "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
            "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
          },
          // States
          {
            "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
            "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
            "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
            "cursor-default opacity-60": props.disabled
          },
          // Transitions
          "transition-colors",
          "duration-200"
        ]
      }),
      input: {
        class: [
          "peer",
          // Size
          "w-full ",
          "h-full",
          // Position
          "absolute",
          "top-0 left-0",
          "z-10",
          // Spacing
          "p-0",
          "m-0",
          // Shape
          "opacity-0",
          "rounded-md",
          "outline-none",
          "border-2 border-surface-200 dark:border-surface-700",
          // Misc
          "appareance-none",
          "cursor-pointer"
        ]
      },
      icon: {
        class: [
          // Font
          "text-base leading-none",
          // Size
          "w-4",
          "h-4",
          // Colors
          "text-white dark:text-surface-900",
          // Transitions
          "transition-all",
          "duration-200"
        ]
      }
    },
    rowCheckbox: {
      root: {
        class: [
          "relative",
          // Alignment
          "inline-flex",
          "align-bottom",
          // Size
          "w-6",
          "h-6",
          // Misc
          "cursor-pointer",
          "select-none"
        ]
      },
      box: ({ props, context }) => ({
        class: [
          // Alignment
          "flex",
          "items-center",
          "justify-center",
          // Size
          "w-6",
          "h-6",
          // Shape
          "rounded-md",
          "border-2",
          // Colors
          {
            "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
            "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
          },
          // States
          {
            "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
            "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
            "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
            "cursor-default opacity-60": props.disabled
          },
          // Transitions
          "transition-colors",
          "duration-200"
        ]
      }),
      input: {
        class: [
          "peer",
          // Size
          "w-full ",
          "h-full",
          // Position
          "absolute",
          "top-0 left-0",
          "z-10",
          // Spacing
          "p-0",
          "m-0",
          // Shape
          "opacity-0",
          "rounded-md",
          "outline-none",
          "border-2 border-surface-200 dark:border-surface-700",
          // Misc
          "appareance-none",
          "cursor-pointer"
        ]
      },
      icon: {
        class: [
          // Font
          "text-base leading-none",
          // Size
          "w-4",
          "h-4",
          // Colors
          "text-white dark:text-surface-900",
          // Transitions
          "transition-all",
          "duration-200"
        ]
      }
    },
    transition: {
      enterFromClass: "opacity-0 scale-y-[0.8]",
      enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
      leaveActiveClass: "transition-opacity duration-100 ease-linear",
      leaveToClass: "opacity-0"
    }
  },
  bodyrow: ({ context, props }) => ({
    class: [
      // Color
      "dark:text-white/80",
      { "bg-primary-50 text-primary-700 dark:bg-primary-400/30": context.selected },
      { "bg-surface-0 text-surface-600 dark:bg-surface-800": !context.selected },
      { "font-bold bg-surface-0 dark:bg-surface-800": props.frozenRow },
      { "odd:bg-surface-0 odd:text-surface-600 dark:odd:bg-surface-800 even:bg-surface-50 even:text-surface-600 dark:even:bg-surface-900/50": context.stripedRows },
      // State
      { "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 ring-inset dark:focus:ring-primary-300/50": context.selectable },
      { "hover:bg-surface-300/20 hover:text-surface-600": props.selectionMode && !context.selected },
      // Transition
      { "transition duration-200": props.selectionMode && !context.selected || props.rowHover },
      // Misc
      { "cursor-pointer": props.selectionMode }
    ]
  }),
  rowexpansion: {
    class: "bg-surface-0 dark:bg-surface-800 text-surface-600 dark:text-white/80"
  },
  rowgroupheader: {
    class: ["sticky z-20", "bg-surface-0 text-surface-600 dark:text-white/70", "dark:bg-surface-800"]
  },
  rowgroupfooter: {
    class: ["sticky z-20", "bg-surface-0 text-surface-600 dark:text-white/70", "dark:bg-surface-800"]
  },
  rowgrouptoggler: {
    class: [
      "relative",
      // Flex & Alignment
      "inline-flex items-center justify-center",
      "text-left",
      // Spacing
      "m-0 p-0",
      // Size
      "w-8 h-8",
      // Shape
      "border-0 rounded-full",
      // Color
      "text-surface-500 dark:text-white/70",
      "bg-transparent",
      "focus-visible:outline-none focus-visible:outline-offset-0",
      "focus-visible:ring focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      // Transition
      "transition duration-200",
      // Misc
      "overflow-hidden",
      "cursor-pointer select-none"
    ]
  },
  rowgrouptogglericon: {
    class: "inline-block w-4 h-4"
  },
  resizehelper: {
    class: "absolute hidden w-[2px] z-20 bg-primary-500 dark:bg-primary-400"
  }
};
const dataview = {
  content: {
    class: [
      // Spacing
      "p-0",
      // Shape
      "border-0",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-800"
    ]
  },
  grid: {
    class: [
      // flex
      "flex flex-wrap",
      // Spacing
      "ml-0 mr-0 mt-0",
      // Color
      "bg-surface-0 dark:bg-surface-800"
    ]
  },
  header: {
    class: [
      "font-bold",
      // Spacing
      "p-4",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-surface-50 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700 border-y"
    ]
  }
};
const dataviewlayoutoptions = {
  listbutton: ({ props }) => ({
    class: [
      // Font
      "leading-none",
      // Flex Alignment
      "inline-flex items-center align-bottom text-center",
      // Shape
      "border rounded-md rounded-r-none",
      // Spacing
      "px-4 py-3",
      // Color
      props.modelValue === "list" ? "bg-primary-500 dark:bg-primary-400 border-primary-500 dark:border-primary-400 text-white dark:text-surface-900" : "bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-white/80",
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      props.modelValue === "list" ? "hover:bg-primary-600 dark:hover:bg-primary-300" : "hover:bg-surface-50 dark:hover:bg-surface-800/80",
      // Transition
      "transition duration-200",
      // Misc
      "cursor-pointer select-none overflow-hidden"
    ]
  }),
  gridbutton: ({ props }) => ({
    class: [
      // Font
      "leading-none",
      // Flex Alignment
      "inline-flex items-center align-bottom text-center",
      // Shape
      "border rounded-md rounded-l-none",
      // Spacing
      "px-4 py-3",
      // Color
      props.modelValue === "grid" ? "bg-primary-500 dark:bg-primary-400 border-primary-500 dark:border-primary-400 text-white dark:text-surface-900" : "bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-white/80",
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      props.modelValue === "grid" ? "hover:bg-primary-600 dark:hover:bg-primary-300" : "hover:bg-surface-50 dark:hover:bg-surface-800/80",
      // Transition
      "transition duration-200",
      // Misc
      "cursor-pointer select-none overflow-hidden"
    ]
  })
};
const dialog = {
  root: ({ state }) => ({
    class: [
      // Shape
      "rounded-lg",
      "shadow-lg",
      "border-0",
      // Size
      "max-h-[90vh]",
      "w-[50vw]",
      "m-0",
      // Color
      "dark:border",
      "dark:border-surface-700",
      // Transitions
      "transform",
      "scale-100",
      // Maximized State
      {
        "transition-none": state.maximized,
        "transform-none": state.maximized,
        "!w-screen": state.maximized,
        "!h-screen": state.maximized,
        "!max-h-full": state.maximized,
        "!top-0": state.maximized,
        "!left-0": state.maximized
      }
    ]
  }),
  header: {
    class: [
      // Flexbox and Alignment
      "flex items-center justify-between",
      "shrink-0",
      // Spacing
      "p-6",
      // Shape
      "border-t-0",
      "rounded-tl-lg",
      "rounded-tr-lg",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-surface-0/80"
    ]
  },
  title: {
    class: ["font-bold text-lg"]
  },
  icons: {
    class: ["flex items-center"]
  },
  closeButton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "flex items-center justify-center",
      // Size and Spacing
      "mr-2",
      "last:mr-0",
      "w-8 h-8",
      // Shape
      "border-0",
      "rounded-full",
      // Colors
      "text-surface-500",
      "bg-transparent",
      // Transitions
      "transition duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-inset",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "overflow-hidden"
    ]
  },
  maximizablebutton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "flex items-center justify-center",
      // Size and Spacing
      "mr-2",
      "last:mr-0",
      "w-8 h-8",
      // Shape
      "border-0",
      "rounded-full",
      // Colors
      "text-surface-500",
      "bg-transparent",
      // Transitions
      "transition duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-inset",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "overflow-hidden"
    ]
  },
  closeButtonIcon: {
    class: [
      // Display
      "inline-block",
      // Size
      "w-4",
      "h-4"
    ]
  },
  maximizableicon: {
    class: [
      // Display
      "inline-block",
      // Size
      "w-4",
      "h-4"
    ]
  },
  content: ({ state, instance }) => ({
    class: [
      // Spacing
      "px-6",
      "pb-8",
      "pt-0",
      // Shape
      {
        grow: state.maximized,
        "rounded-bl-lg": !instance.$slots.footer,
        "rounded-br-lg": !instance.$slots.footer
      },
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-surface-0/80",
      // Misc
      "overflow-y-auto"
    ]
  }),
  footer: {
    class: [
      // Flexbox and Alignment
      "flex items-center justify-end",
      "shrink-0",
      "text-right",
      "gap-2",
      // Spacing
      "px-6",
      "pb-6",
      // Shape
      "border-t-0",
      "rounded-b-lg",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-surface-0/80"
    ]
  },
  mask: ({ props }) => ({
    class: [
      // Transitions
      "transition-all",
      "duration-300",
      { "p-5": !props.position == "full" },
      // Background and Effects
      { "has-[.mask-active]:bg-transparent bg-black/40": props.modal, "has-[.mask-active]:backdrop-blur-none backdrop-blur-sm": props.modal }
    ]
  }),
  transition: ({ props }) => {
    return props.position === "top" ? {
      enterFromClass: "opacity-0 scale-75 translate-x-0 -translate-y-full translate-z-0 mask-active",
      enterActiveClass: "transition-all duration-200 ease-out",
      leaveActiveClass: "transition-all duration-200 ease-out",
      leaveToClass: "opacity-0 scale-75 translate-x-0 -translate-y-full translate-z-0 mask-active"
    } : props.position === "bottom" ? {
      enterFromClass: "opacity-0 scale-75 translate-y-full mask-active",
      enterActiveClass: "transition-all duration-200 ease-out",
      leaveActiveClass: "transition-all duration-200 ease-out",
      leaveToClass: "opacity-0 scale-75 translate-x-0 translate-y-full translate-z-0 mask-active"
    } : props.position === "left" || props.position === "topleft" || props.position === "bottomleft" ? {
      enterFromClass: "opacity-0 scale-75 -translate-x-full translate-y-0 translate-z-0 mask-active",
      enterActiveClass: "transition-all duration-200 ease-out",
      leaveActiveClass: "transition-all duration-200 ease-out",
      leaveToClass: "opacity-0 scale-75  -translate-x-full translate-y-0 translate-z-0 mask-active"
    } : props.position === "right" || props.position === "topright" || props.position === "bottomright" ? {
      enterFromClass: "opacity-0 scale-75 translate-x-full translate-y-0 translate-z-0 mask-active",
      enterActiveClass: "transition-all duration-200 ease-out",
      leaveActiveClass: "transition-all duration-200 ease-out",
      leaveToClass: "opacity-0 scale-75 translate-x-full translate-y-0 translate-z-0 mask-active"
    } : {
      enterFromClass: "opacity-0 scale-75 mask-active",
      enterActiveClass: "transition-all duration-200 ease-out",
      leaveActiveClass: "transition-all duration-200 ease-out",
      leaveToClass: "opacity-0 scale-75 mask-active"
    };
  }
};
const divider = {
  root: ({ props }) => ({
    class: [
      // Flex and Position
      "flex relative",
      { "justify-center": props.layout == "vertical" },
      { "items-center": props.layout == "vertical" },
      {
        "justify-start": (props == null ? void 0 : props.align) == "left" && props.layout == "horizontal",
        "justify-center": (props == null ? void 0 : props.align) == "center" && props.layout == "horizontal",
        "justify-end": (props == null ? void 0 : props.align) == "right" && props.layout == "horizontal",
        "items-center": (props == null ? void 0 : props.align) == "top" && props.layout == "vertical",
        "items-start": (props == null ? void 0 : props.align) == "center" && props.layout == "vertical",
        "items-end": (props == null ? void 0 : props.align) == "bottom" && props.layout == "vertical"
      },
      // Spacing
      {
        "my-5 mx-0 py-0 px-5": props.layout == "horizontal",
        "mx-4 md:mx-5 py-5": props.layout == "vertical"
      },
      // Size
      {
        "w-full": props.layout == "horizontal",
        "min-h-full": props.layout == "vertical"
      },
      // Before: Line
      "before:block",
      // Position
      {
        "before:absolute before:left-0 before:top-1/2": props.layout == "horizontal",
        "before:absolute before:left-1/2 before:top-0 before:transform before:-translate-x-1/2": props.layout == "vertical"
      },
      // Size
      {
        "before:w-full": props.layout == "horizontal",
        "before:min-h-full": props.layout == "vertical"
      },
      // Shape
      {
        "before:border-solid": props.type == "solid",
        "before:border-dotted": props.type == "dotted",
        "before:border-dashed": props.type == "dashed"
      },
      // Color
      {
        "before:border-t before:border-surface-200 before:dark:border-surface-600": props.layout == "horizontal",
        "before:border-l before:border-surface-200 before:dark:border-surface-600": props.layout == "vertical"
      }
    ]
  }),
  content: {
    class: [
      // Space and Position
      "px-1 z-10",
      // Color
      "bg-surface-0 dark:bg-surface-800"
    ]
  }
};
const dock = {
  root: ({ props }) => ({
    class: [
      // Positioning
      "absolute z-1",
      {
        "left-0 bottom-0 w-full": props.position == "bottom",
        "left-0 top-0 w-full": props.position == "top",
        "left-0 top-0 h-full": props.position == "left",
        "right-0 top-0 h-full": props.position == "right"
      },
      // Flexbox & Alignment
      "flex justify-center items-center",
      // Interactivity
      "pointer-events-none"
    ]
  }),
  container: {
    class: [
      // Flexbox
      "flex",
      // Shape & Border
      "rounded-md",
      // Color
      "bg-surface-0/10 dark:bg-surface-900/20 border border-surface-0/20",
      "backdrop-blur-sm",
      // Spacing
      "p-2",
      // Misc
      "pointer-events-auto"
    ]
  },
  menu: ({ props }) => ({
    class: [
      // Flexbox & Alignment
      "flex items-center justify-center",
      {
        "flex-col": props.position == "left" || props.position == "right"
      },
      // List Style
      "m-0 p-0 list-none",
      // Shape
      "outline-none"
    ]
  }),
  menuitem: ({ props, context, instance }) => ({
    class: [
      // Spacing & Shape
      "p-2 rounded-md",
      // Conditional Scaling
      {
        "hover:scale-150": instance.currentIndex === context.index,
        "scale-125": instance.currentIndex - 1 === context.index || instance.currentIndex + 1 === context.index,
        "scale-110": instance.currentIndex - 2 === context.index || instance.currentIndex + 2 === context.index
      },
      // Positioning & Hover States
      {
        "origin-bottom hover:mx-6": props.position == "bottom",
        "origin-top hover:mx-6": props.position == "top",
        "origin-left hover:my-6": props.position == "left",
        "origin-right hover:my-6": props.position == "right"
      },
      // Transitions & Transform
      "transition-all duration-200 ease-cubic-bezier-will-change-transform transform"
    ]
  }),
  action: {
    class: [
      // Flexbox & Alignment
      "flex flex-col items-center justify-center",
      // Position
      "relative",
      // Size
      "w-16 h-16",
      // Misc
      "cursor-default overflow-hidden"
    ]
  }
};
const dropdown = {
  root: ({ props, state }) => ({
    class: [
      // Display and Position
      "inline-flex",
      "relative",
      // Shape
      "rounded-md",
      // Color and Background
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-700",
      // Transitions
      "transition-all",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-300",
      { "outline-none outline-offset-0 ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
      // Misc
      "cursor-pointer",
      "select-none",
      { "opacity-60": props.disabled, "pointer-events-none": props.disabled, "cursor-default": props.disabled }
    ]
  }),
  input: ({ props }) => ({
    class: [
      //Font
      "font-sans",
      "leading-none",
      // Display
      "block",
      "flex-auto",
      // Color and Background
      "bg-transparent",
      "border-0",
      { "text-surface-800 dark:text-white/80": props.modelValue != void 0, "text-surface-400 dark:text-surface-500": props.modelValue == void 0 },
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      // Sizing and Spacing
      "w-[1%]",
      "p-3",
      { "pr-7": props.showClear },
      //Shape
      "rounded-none",
      // Transitions
      "transition",
      "duration-200",
      // States
      "focus:outline-none focus:shadow-none",
      // Misc
      "relative",
      "cursor-pointer",
      "overflow-hidden overflow-ellipsis",
      "whitespace-nowrap",
      "appearance-none"
    ]
  }),
  trigger: {
    class: [
      // Flexbox
      "flex items-center justify-center",
      "shrink-0",
      // Color and Background
      "bg-transparent",
      "text-surface-500",
      // Size
      "w-12",
      // Shape
      "rounded-tr-md",
      "rounded-br-md"
    ]
  },
  panel: {
    class: [
      // Position
      "absolute top-0 left-0",
      // Shape
      "border-0 dark:border",
      "rounded-md",
      "shadow-md",
      // Color
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-800 dark:text-white/80",
      "dark:border-surface-700"
    ]
  },
  wrapper: {
    class: [
      // Sizing
      "max-h-[200px]",
      // Misc
      "overflow-auto"
    ]
  },
  list: {
    class: "py-3 list-none m-0"
  },
  item: ({ context }) => ({
    class: [
      // Font
      "font-normal",
      "leading-none",
      // Position
      "relative",
      // Shape
      "border-0",
      "rounded-none",
      // Spacing
      "m-0",
      "py-3 px-5",
      // Color
      { "text-surface-700 dark:text-white/80": !context.focused && !context.selected && !context.disabled },
      { "text-surface-600 dark:text-white/70": !context.focused && !context.selected && context.disabled },
      { "bg-surface-200 dark:bg-surface-600/60 text-surface-700 dark:text-white/80": context.focused && !context.selected },
      { "bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context.focused && context.selected },
      { "bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": !context.focused && context.selected },
      //States
      { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.focused && !context.selected },
      { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": context.focused && !context.selected },
      "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      // Transitions
      "transition-shadow",
      "duration-200",
      // Misc
      { "pointer-events-none cursor-default": context.disabled },
      { "cursor-pointer": !context.disabled },
      "overflow-hidden",
      "whitespace-nowrap"
    ]
  }),
  itemgroup: {
    class: [
      //Font
      "font-bold",
      // Spacing
      "m-0",
      "py-3 px-5",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-600/80",
      // Misc
      "cursor-auto"
    ]
  },
  emptymessage: {
    class: [
      // Font
      "leading-none",
      // Spacing
      "py-3 px-5",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-transparent"
    ]
  },
  header: {
    class: [
      // Spacing
      "py-3 px-5",
      "m-0",
      //Shape
      "border-b",
      "rounded-tl-md",
      "rounded-tr-md",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-100 dark:bg-surface-800",
      "border-surface-300 dark:border-surface-700"
    ]
  },
  filtercontainer: {
    class: "relative"
  },
  filterinput: {
    class: [
      // Font
      "font-sans",
      "leading-none",
      // Sizing
      "pr-7 py-3 px-3",
      "-mr-7",
      "w-full",
      //Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-900",
      "border-surface-200 dark:border-surface-700",
      // Shape
      "border",
      "rounded-lg",
      "appearance-none",
      // Transitions
      "transition",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-300",
      "focus:ring focus:outline-none focus:outline-offset-0",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "appearance-none"
    ]
  },
  filtericon: {
    class: ["absolute", "top-1/2 right-3", "-mt-2"]
  },
  clearicon: {
    class: [
      // Color
      "text-surface-500",
      // Position
      "absolute",
      "top-1/2",
      "right-12",
      // Spacing
      "-mt-2"
    ]
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const fieldset = {
  root: {
    class: [
      "block",
      // Spacing
      "px-4 pt-2 py-3",
      "inline-size-min",
      // Shape
      "rounded-md",
      // Color
      "border border-surface-200 dark:border-surface-700",
      "bg-surface-0 dark:bg-surface-900",
      "text-surface-700 dark:text-surface-0/80"
    ]
  },
  legend: ({ props }) => ({
    class: [
      // Font
      "font-bold",
      "leading-none",
      //Spacing
      { "p-0": props.toggleable, "p-5": !props.toggleable },
      // Shape
      "rounded-md",
      // Color
      "text-surface-700 dark:text-surface-0/80",
      "border border-surface-200 dark:border-surface-700",
      "bg-surface-50 dark:bg-surface-900",
      // Transition
      "transition-none",
      // States
      { "hover:bg-surface-100 hover:border-surface-200 hover:text-surface-900 dark:hover:text-surface-0/80 dark:hover:bg-surface-800/80": props.toggleable }
    ]
  }),
  toggler: ({ props }) => ({
    class: [
      // Alignments
      "flex items-center justify-center",
      "relative",
      //Spacing
      { "p-5": props.toggleable },
      // Shape
      { "rounded-md": props.toggleable },
      // Color
      { "text-surface-700 dark:text-surface-200 hover:text-surface-900": props.toggleable },
      // States
      { "hover:text-surface-900 dark:hover:text-surface-100": props.toggleable },
      { "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50": props.toggleable },
      // Misc
      {
        "transition-none cursor-pointer overflow-hidden select-none": props.toggleable
      }
    ]
  }),
  togglerIcon: {
    class: "mr-2 inline-block"
  },
  legendTitle: {
    class: "flex items-center justify-center leading-none"
  },
  content: {
    class: "p-5"
  },
  transition: {
    enterFromClass: "max-h-0",
    enterActiveClass: "overflow-hidden transition-[max-height] duration-1000 ease-[cubic-bezier(0.42,0,0.58,1)]",
    enterToClass: "max-h-[1000px]",
    leaveFromClass: "max-h-[1000px]",
    leaveActiveClass: "overflow-hidden transition-[max-height] duration-[450ms] ease-[cubic-bezier(0,1,0,1)]",
    leaveToClass: "max-h-0"
  }
};
const galleria = {
  content: {
    class: "flex flex-col"
  },
  itemwrapper: {
    class: "flex flex-col relative"
  },
  itemcontainer: {
    class: "relative flex h-full"
  },
  item: {
    class: [
      // Flex
      "flex justify-center items-center h-full w-full",
      // Sizing
      "h-full w-full"
    ]
  },
  thumbnailwrapper: {
    class: [
      // Flex
      "flex flex-col shrink-0",
      // Misc
      "overflow-auto"
    ]
  },
  thumbnailcontainer: {
    class: [
      // Flex
      "flex flex-row",
      // Spacing
      "p-4",
      // Colors
      "bg-black/90"
    ]
  },
  previousthumbnailbutton: {
    class: [
      // Positioning
      "self-center relative",
      // Display & Flexbox
      "flex shrink-0 justify-center items-center overflow-hidden",
      // Spacing
      "m-2",
      // Appearance
      "bg-transparent text-white w-8 h-8 rounded-full transition duration-200 ease-in-out",
      // Hover Effects
      "hover:bg-surface-0/10 hover:text-white",
      // Focus Effects
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
    ]
  },
  thumbnailitemscontainer: {
    class: "overflow-hidden w-full"
  },
  thumbnailitems: {
    class: "flex"
  },
  thumbnailitem: {
    class: ["overflow-auto flex items-center justify-center cursor-pointer opacity-50", "flex-1 grow-0 shrink-0 w-20", "hover:opacity-100 hover:transition-opacity hover:duration-300"]
  },
  nextthumbnailbutton: {
    class: [
      // Positioning
      "self-center relative",
      // Display & Flexbox
      "flex shrink-0 justify-center items-center overflow-hidden",
      // Spacing
      "m-2",
      // Appearance
      "bg-transparent text-white w-8 h-8 rounded-full transition duration-200 ease-in-out",
      // Hover Effects
      "hover:bg-surface-0/10 hover:text-white",
      // Focus Effects
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
    ]
  },
  indicators: {
    class: ["flex items-center justify-center", "p-4"]
  },
  indicator: {
    class: "mr-2"
  },
  indicatorbutton: ({ context }) => ({
    class: [
      // Size
      "w-4 h-4",
      // Appearance
      "rounded-full transition duration-200",
      // Focus Effects
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Conditional Appearance: Not Highlighted
      { "bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600": !context.highlighted },
      // Conditional Appearance: Highlighted
      { "bg-primary-500 hover:bg-primary-600": context.highlighted }
    ]
  }),
  mask: {
    class: ["fixed top-0 left-0 w-full h-full", "flex items-center justify-center", "bg-black bg-opacity-90"]
  },
  closebutton: {
    class: [
      // Positioning
      "absolute top-0 right-0",
      // Display & Flexbox
      "flex justify-center items-center overflow-hidden",
      // Spacing
      "m-2",
      // Appearance
      "text-white bg-transparent w-12 h-12 rounded-full transition duration-200 ease-in-out",
      // Hover Effect
      "hover:text-white hover:bg-surface-0/10",
      // Focus Effects
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
    ]
  },
  closeicon: {
    class: "w-6 h-6"
  },
  previousitembutton: {
    class: [
      // Display & Flexbox
      "inline-flex justify-center items-center overflow-hidden",
      // Appearance
      "bg-transparent text-white w-16 h-16 transition duration-200 ease-in-out rounded-md",
      // Spacing
      "mx-2",
      // Positioning
      "fixed top-1/2 mt-[-0.5rem] left-0",
      // Hover Effect
      "hover:bg-surface-0/10 hover:text-white",
      // Focus Effects
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
    ]
  },
  nextitembutton: {
    class: [
      // Display & Flexbox
      "inline-flex justify-center items-center overflow-hidden",
      // Appearance
      "bg-transparent text-white w-16 h-16 transition duration-200 ease-in-out rounded-md",
      // Spacing
      "mx-2",
      // Positioning
      "fixed top-1/2 mt-[-0.5rem] right-0",
      // Hover Effect
      "hover:bg-surface-0/10 hover:text-white",
      // Focus Effects
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50"
    ]
  },
  caption: {
    class: [
      // Positioning
      "absolute bottom-0 left-0 w-full",
      // Appearance
      "bg-black/50 text-white p-4"
    ]
  },
  transition: {
    enterFromClass: "opacity-0 scale-75",
    enterActiveClass: "transition-all duration-150 ease-in-out",
    leaveActiveClass: "transition-all duration-150 ease-in",
    leaveToClass: "opacity-0 scale-75"
  }
};
const global$1 = {
  css: `
    *[data-pd-ripple="true"]{
        overflow: hidden;
        position: relative;
    }
    span[data-p-ink-active="true"]{
        animation: ripple 0.4s linear;
    }
    @keyframes ripple {
        100% {
            opacity: 0;
            transform: scale(2.5);
        }
    }

    .progress-spinner-circle {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: 0;
        animation: p-progress-spinner-dash 1.5s ease-in-out infinite, p-progress-spinner-color 6s ease-in-out infinite;
        stroke-linecap: round;
    }

    @keyframes p-progress-spinner-dash{
        0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
        }

        50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35px;
        }
        100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124px;
        }
    }
    @keyframes p-progress-spinner-color {
        100%, 0% {
            stroke: #ff5757;
        }
        40% {
            stroke: #696cff;
        }
        66% {
            stroke: #1ea97c;
        }
        80%, 90% {
            stroke: #cc8925;
        }
    }

    .progressbar-value-animate::after {
        will-change: left, right;
        animation: p-progressbar-indeterminate-anim-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
    }
    .progressbar-value-animate::before {
        will-change: left, right;
        animation: p-progressbar-indeterminate-anim 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
    }
    @keyframes p-progressbar-indeterminate-anim {
        0% {
            left: -35%;
            right: 100%;
        }
        60% {
            left: 100%;
            right: -90%;
        }
        100% {
            left: 100%;
            right: -90%;
        }
    }

    .p-fadein {
        animation: p-fadein 250ms linear;
    }

    @keyframes p-fadein {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
`
};
const image = {
  root: {
    class: "relative inline-block"
  },
  button: {
    class: [
      // Flexbox & Alignment
      "flex items-center justify-center",
      // Positioning
      "absolute",
      // Shape
      "inset-0 opacity-0 transition-opacity duration-300",
      // Color
      "bg-transparent text-surface-100",
      // States
      "hover:opacity-100 hover:cursor-pointer hover:bg-black/50 hover:bg-opacity-50"
    ]
  },
  mask: {
    class: [
      // Flexbox & Alignment
      "flex items-center justify-center",
      // Positioning
      "fixed top-0 left-0",
      // Sizing
      "w-full h-full",
      // Color
      "bg-black/90"
    ]
  },
  toolbar: {
    class: [
      // Flexbox
      "flex",
      // Positioning
      "absolute top-0 right-0",
      // Spacing
      "p-4"
    ]
  },
  rotaterightbutton: {
    class: [
      "z-20",
      // Flexbox & Alignment
      "flex justify-center items-center",
      // Size
      "w-12 h-12",
      // Spacing
      "mr-2",
      // Shape
      "rounded-full",
      // Color
      "text-white bg-transparent",
      // States
      "hover:text-white hover:bg-surface-0/10",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transition
      "transition duration-200 ease-in-out"
    ]
  },
  rotaterighticon: {
    class: "w-6 h-6"
  },
  rotateleftbutton: {
    class: [
      "z-20",
      // Flexbox & Alignment
      "flex justify-center items-center",
      // Size
      "w-12 h-12",
      // Spacing
      "mr-2",
      // Shape
      "rounded-full",
      // Color
      "text-white bg-transparent",
      // States
      "hover:text-white hover:bg-surface-0/10",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transition
      "transition duration-200 ease-in-out"
    ]
  },
  rotatelefticon: {
    class: "w-6 h-6"
  },
  zoomoutbutton: {
    class: [
      "z-20",
      // Flexbox & Alignment
      "flex justify-center items-center",
      // Size
      "w-12 h-12",
      // Spacing
      "mr-2",
      // Shape
      "rounded-full",
      // Color
      "text-white bg-transparent",
      // States
      "hover:text-white hover:bg-surface-0/10",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transition
      "transition duration-200 ease-in-out"
    ]
  },
  zoomouticon: {
    class: "w-6 h-6"
  },
  zoominbutton: {
    class: [
      "z-20",
      // Flexbox & Alignment
      "flex justify-center items-center",
      // Size
      "w-12 h-12",
      // Spacing
      "mr-2",
      // Shape
      "rounded-full",
      // Color
      "text-white bg-transparent",
      // States
      "hover:text-white hover:bg-surface-0/10",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transition
      "transition duration-200 ease-in-out"
    ]
  },
  zoominicon: {
    class: "w-6 h-6"
  },
  closebutton: {
    class: [
      "z-20",
      // Flexbox & Alignment
      "flex justify-center items-center",
      // Size
      "w-12 h-12",
      // Spacing
      "mr-2",
      // Shape
      "rounded-full",
      // Color
      "text-white bg-transparent",
      // States
      "hover:text-white hover:bg-surface-0/10",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transition
      "transition duration-200 ease-in-out"
    ]
  },
  closeicon: {
    class: "w-6 h-6"
  },
  transition: {
    enterFromClass: "opacity-0 scale-75",
    enterActiveClass: "transition-all duration-150 ease-in-out",
    leaveActiveClass: "transition-all duration-150 ease-in",
    leaveToClass: "opacity-0 scale-75"
  }
};
const inlinemessage = {
  root: ({ props }) => ({
    class: [
      "inline-flex items-center justify-center align-top gap-2",
      "p-3 m-0 rounded-md dark:border",
      {
        "bg-blue-100/70 dark:bg-blue-500/20": props.severity == "info",
        "bg-green-100/70 dark:bg-green-500/20": props.severity == "success",
        "bg-orange-100/70 dark:bg-orange-500/20": props.severity == "warn",
        "bg-red-100/70 dark:bg-red-500/20": props.severity == "error"
      },
      {
        "dark:border-blue-400": props.severity == "info",
        "dark:border-green-400": props.severity == "success",
        "dark:border-orange-400": props.severity == "warn",
        "dark:border-red-400": props.severity == "error"
      },
      {
        "text-blue-700 dark:text-blue-300": props.severity == "info",
        "text-green-700 dark:text-green-300": props.severity == "success",
        "text-orange-700 dark:text-orange-300": props.severity == "warn",
        "text-red-700 dark:text-red-300": props.severity == "error"
      }
    ]
  }),
  icon: {
    class: "text-base"
  },
  text: {
    class: [
      // Font and Text
      "text-base leading-none",
      "font-medium"
    ]
  }
};
const inputgroup = {
  root: {
    class: ["flex items-stretch", "w-full"]
  }
};
const inputgroupaddon = {
  root: {
    class: [
      // Flex
      "flex items-center justify-center",
      // Shape
      "first:rounded-l-md",
      "last:rounded-r-md",
      "border-y",
      "last:border-r",
      "border-l",
      "border-r-0",
      // Space
      "p-3",
      // Size
      "min-w-[3rem]",
      // Color
      "bg-surface-50 dark:bg-surface-800",
      "text-surface-600 dark:text-surface-400",
      "border-surface-300 dark:border-surface-600"
    ]
  }
};
const inputmask = {
  root: ({ context }) => ({
    class: [
      // Font
      "font-sans leading-none",
      // Spacing
      "m-0 p-3",
      // Colors
      "text-surface-600 dark:text-surface-200",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-600",
      // States
      {
        "hover:border-primary-500 dark:hover:border-primary-400": !context.disabled,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50": !context.disabled,
        "opacity-60 select-none pointer-events-none cursor-default": context.disabled
      },
      // Misc
      "rounded-md",
      "appearance-none",
      "transition-colors duration-200"
    ]
  })
};
const inputnumber = {
  root: ({ props, parent }) => ({
    class: [
      // Flex
      "inline-flex",
      { "flex-col": props.showButtons && props.buttonLayout == "vertical" },
      { "flex-1 w-[1%]": parent.instance.$name == "InputGroup" },
      // Shape
      { "first:rounded-l-md rounded-none last:rounded-r-md": parent.instance.$name == "InputGroup" && !props.showButtons },
      { "border-0 border-y border-l last:border-r border-surface-300 dark:border-surface-600": parent.instance.$name == "InputGroup" && !props.showButtons },
      { "first:ml-0 ml-[-1px]": parent.instance.$name == "InputGroup" && !props.showButtons },
      //Sizing
      { "!w-16": props.showButtons && props.buttonLayout == "vertical" }
    ]
  }),
  input: {
    root: ({ parent, context }) => {
      var _a, _b;
      return {
        class: [
          // Display
          "flex flex-auto",
          // Font
          "font-sans leading-none",
          //Text
          { "text-center": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
          // Spacing
          "p-3",
          "m-0",
          // Shape
          "rounded-lg",
          { "rounded-tr-none rounded-br-none": parent.props.showButtons },
          { "rounded-tl-none rounded-bl-none": parent.props.showButtons && parent.props.buttonLayout == "horizontal" },
          { "rounded-none": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
          { "!rounded-none": ((_a = parent.instance.$parentInstance) == null ? void 0 : _a.$name) == "InputGroup" && !parent.props.showButtons },
          { "border-0": ((_b = parent.instance.$parentInstance) == null ? void 0 : _b.$name) == "InputGroup" && !parent.props.showButtons },
          // Colorsh
          "text-surface-600 dark:text-surface-200",
          "placeholder:text-surface-400 dark:placeholder:text-surface-500",
          "bg-surface-0 dark:bg-surface-900",
          "border border-surface-300 dark:border-surface-600",
          // States
          "hover:border-primary-500 dark:hover:border-primary-400",
          "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50 focus:z-10",
          { "opacity-60 select-none pointer-events-none cursor-default": context.disabled },
          //Position
          { "order-2": parent.props.buttonLayout == "horizontal" || parent.props.buttonLayout == "vertical" }
        ]
      };
    }
  },
  buttongroup: ({ props }) => ({
    class: [
      // Flex
      "flex",
      "flex-col"
    ]
  }),
  incrementbutton: {
    root: ({ parent }) => ({
      class: [
        // Display
        "flex flex-auto",
        // Alignment
        "items-center",
        "justify-center",
        "text-center align-bottom",
        //Position
        "relative",
        { "order-3": parent.props.showButtons && parent.props.buttonLayout == "horizontal" },
        { "order-1": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
        //Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Sizing
        "w-[3rem]",
        { "px-4 py-3": parent.props.showButtons && parent.props.buttonLayout !== "stacked" },
        { "p-0": parent.props.showButtons && parent.props.buttonLayout == "stacked" },
        { "w-full": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
        // Shape
        "rounded-md",
        { "rounded-tl-none rounded-br-none rounded-bl-none": parent.props.showButtons && parent.props.buttonLayout == "stacked" },
        { "rounded-bl-none rounded-tl-none": parent.props.showButtons && parent.props.buttonLayout == "horizontal" },
        { "rounded-bl-none rounded-br-none": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
        //States
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        //Misc
        "cursor-pointer overflow-hidden select-none"
      ]
    }),
    label: {
      class: "h-0 w-0"
    }
  },
  decrementbutton: {
    root: ({ parent }) => ({
      class: [
        // Display
        "flex flex-auto",
        // Alignment
        "items-center",
        "justify-center",
        "text-center align-bottom",
        //Position
        "relative",
        { "order-1": parent.props.showButtons && parent.props.buttonLayout == "horizontal" },
        { "order-3": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
        //Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Sizing
        "w-[3rem]",
        { "px-4 py-3": parent.props.showButtons && parent.props.buttonLayout !== "stacked" },
        { "p-0": parent.props.showButtons && parent.props.buttonLayout == "stacked" },
        { "w-full": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
        // Shape
        "rounded-md",
        { "rounded-tr-none rounded-tl-none rounded-bl-none": parent.props.showButtons && parent.props.buttonLayout == "stacked" },
        { "rounded-tr-none rounded-br-none ": parent.props.showButtons && parent.props.buttonLayout == "horizontal" },
        { "rounded-tr-none rounded-tl-none ": parent.props.showButtons && parent.props.buttonLayout == "vertical" },
        //States
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        //Misc
        "cursor-pointer overflow-hidden select-none"
      ]
    }),
    label: {
      class: "h-0 w-0"
    }
  }
};
const inputswitch = {
  root: ({ props }) => ({
    class: [
      "inline-block relative",
      "w-12 h-7",
      "rounded-2xl",
      {
        "opacity-60 select-none pointer-events-none cursor-default": props.disabled
      }
    ]
  }),
  slider: ({ props }) => ({
    class: [
      // Position
      "absolute top-0 left-0 right-0 bottom-0",
      { "before:transform before:translate-x-5": props.modelValue == props.trueValue },
      // Shape
      "rounded-2xl",
      // Before:
      "before:absolute before:top-1/2 before:left-1",
      "before:-mt-2.5",
      "before:h-5 before:w-5",
      "before:rounded-full",
      "before:duration-200",
      "before:bg-surface-0 before:dark:bg-surface-900",
      // Colors
      "border border-transparent",
      {
        "bg-surface-200 dark:bg-surface-700": !(props.modelValue == props.trueValue),
        "bg-primary-500 dark:bg-primary-400": props.modelValue == props.trueValue
      },
      // States
      { "peer-hover:bg-surface-300 dark:peer-hover:bg-surface-600 ": !(props.modelValue == props.trueValue) && !props.disabled },
      { "peer-hover:bg-primary-600 dark:peer-hover:bg-surface-300 ": props.modelValue == props.trueValue && !props.disabled },
      "peer-focus-visible:ring peer-focus-visible:ring-primary-400/50 dark:peer-focus-visible:ring-primary-300/50",
      // Transition
      "transition-colors duration-200",
      // Misc
      "cursor-pointer"
    ]
  }),
  input: {
    class: [
      "peer",
      // Size
      "w-full ",
      "h-full",
      // Position
      "absolute",
      "top-0 left-0",
      "z-10",
      // Spacing
      "p-0",
      "m-0",
      // Shape
      "opacity-0",
      "rounded-[2.5rem]",
      "outline-none",
      // Misc
      "appareance-none",
      "cursor-pointer"
    ]
  }
};
const inputtext = {
  root: ({ props, context, parent }) => ({
    class: [
      // Font
      "font-sans leading-none",
      // Flex
      { "flex-1 w-[1%]": parent.instance.$name == "InputGroup" },
      // Spacing
      "m-0",
      {
        "px-4 py-4": props.size == "large",
        "px-2 py-2": props.size == "small",
        "p-3": props.size == null
      },
      // Shape
      { "rounded-md": parent.instance.$name !== "InputGroup" },
      { "first:rounded-l-md rounded-none last:rounded-r-md": parent.instance.$name == "InputGroup" },
      { "border-0 border-y border-l last:border-r": parent.instance.$name == "InputGroup" },
      { "first:ml-0 ml-[-1px]": parent.instance.$name == "InputGroup" && !props.showButtons },
      // Colors
      "text-surface-600 dark:text-surface-200",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-600",
      // States
      {
        "hover:border-primary-500 dark:hover:border-primary-400": !context.disabled,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50 focus:z-10": !context.disabled,
        "opacity-60 select-none pointer-events-none cursor-default": context.disabled
      },
      // Misc
      "appearance-none",
      "transition-colors duration-200"
    ]
  })
};
const knob = {
  root: ({ props }) => ({
    class: [
      // Misc
      { "opacity-60 select-none pointer-events-none cursor-default": props.disabled }
    ]
  }),
  range: {
    class: [
      // Stroke
      "stroke-current",
      // Color
      "stroke-surface-200 dark:stroke-surface-700",
      // Fill
      "fill-none",
      // Transition
      "transition duration-100 ease-in"
    ]
  },
  value: {
    class: [
      // Animation
      "animate-dash-frame",
      // Color
      "stroke-primary-500 dark:stroke-primary-400",
      // Fill
      "fill-none"
    ]
  },
  label: {
    class: [
      // Text Style
      "text-center text-xl",
      // Color
      "fill-surface-600 dark:fill-surface-200"
    ]
  }
};
const listbox = {
  root: {
    class: [
      // Sizing and Shape
      "min-w-[12rem]",
      "rounded-md",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-white/80",
      "border border-surface-200 dark:border-surface-600"
    ]
  },
  wrapper: {
    class: [
      // Overflow
      "overflow-auto"
    ]
  },
  list: {
    class: "py-3 list-none m-0"
  },
  item: ({ context }) => ({
    class: [
      // Font
      "font-normal",
      "leading-none",
      // Position
      "relative",
      // Shape
      "border-0",
      "rounded-none",
      // Spacing
      "m-0",
      "py-3 px-5",
      // Color
      { "text-surface-700 dark:text-white/80": !context.focused && !context.selected },
      { "bg-surface-200 dark:bg-surface-600/60 text-surface-700 dark:text-white/80": context.focused && !context.selected },
      { "bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context.focused && context.selected },
      { "bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": !context.focused && context.selected },
      //States
      { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.focused && !context.selected },
      { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": context.focused && !context.selected },
      "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      // Transitions
      "transition-shadow",
      "duration-200",
      // Misc
      "cursor-pointer",
      "overflow-hidden",
      "whitespace-nowrap"
    ]
  }),
  itemgroup: {
    class: [
      //Font
      "font-bold",
      // Spacing
      "m-0",
      "py-3 px-5",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-600/80",
      // Misc
      "cursor-auto"
    ]
  },
  header: {
    class: [
      // Spacing
      "py-3 px-5",
      "m-0",
      //Shape
      "border-b",
      "rounded-tl-md",
      "rounded-tr-md",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-100 dark:bg-surface-800",
      "border-surface-300 dark:border-surface-600"
    ]
  },
  filtercontainer: {
    class: "relative"
  },
  filterinput: {
    class: [
      // Font
      "font-sans",
      "leading-none",
      // Sizing
      "pr-7 py-3 px-3",
      "-mr-7",
      "w-full",
      //Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-900",
      "border-surface-200 dark:border-surface-700",
      // Shape
      "border",
      "rounded-lg",
      "appearance-none",
      // Transitions
      "transition",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-300",
      "focus:ring focus:outline-none focus:outline-offset-0",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "appearance-none"
    ]
  },
  filtericon: {
    class: ["absolute", "top-1/2 right-3", "-mt-2"]
  },
  emptymessage: {
    class: [
      // Font
      "leading-none",
      // Spacing
      "py-3 px-5",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-transparent"
    ]
  }
};
const megamenu = {
  root: ({ props }) => ({
    class: [
      "relative",
      // Flexbox
      "flex",
      // Shape & Size
      "rounded-md",
      // Color
      "bg-surface-50 dark:bg-surface-700",
      "border border-surface-200 dark:border-surface-700",
      { "p-2 items-center": props.orientation == "horizontal", "flex-col sm:w-48 p-0 py-1": props.orientation !== "horizontal" }
    ]
  }),
  menu: ({ props }) => ({
    class: [
      // Flexbox
      "sm:flex",
      "items-center",
      "flex-wrap",
      "flex-col sm:flex-row",
      { hidden: !(props == null ? void 0 : props.mobileActive), flex: props == null ? void 0 : props.mobileActive },
      // Position
      "absolute sm:relative",
      "top-full left-0",
      "sm:top-auto sm:left-auto",
      // Size
      "w-full sm:w-auto",
      // Spacing
      "m-0",
      "py-1 sm:py-0 sm:p-0",
      "list-none",
      // Shape
      "shadow-md sm:shadow-none",
      "border-0",
      // Color
      "bg-surface-0 dark:bg-surface-700 sm:bg-transparent dark:sm:bg-transparent",
      // Misc
      "outline-none"
    ]
  }),
  menuitem: ({ props }) => ({
    class: [
      "sm:relative static",
      {
        "sm:w-auto w-full": props.horizontal,
        "w-full": !props.horizontal
      }
    ]
  }),
  content: ({ props, context }) => ({
    class: [
      // Shape
      { "rounded-md": props.level < 1 && props.horizontal },
      //  Colors
      {
        "text-surface-500 dark:text-white/70": !context.focused && !context.active,
        "text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-surface-600/90": context.focused && !context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": context.focused && context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": !context.focused && context.active
      },
      // Hover States
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.active,
        "hover:bg-primary-500/50 dark:hover:bg-primary-300/30 text-primary-700 dark:text-surface-0/80": context.active
      },
      // Transitions
      "transition-all",
      "duration-200"
    ]
  }),
  action: {
    class: [
      "relative",
      // Flexbox
      "flex",
      "items-center",
      // Spacing
      "py-3",
      "px-5",
      // Size
      "py-3 pr-5 pl-9 sm:pl-5",
      "leading-none",
      // Misc
      "select-none",
      "cursor-pointer",
      "no-underline ",
      "overflow-hidden"
    ]
  },
  icon: {
    class: "mr-2"
  },
  submenuicon: ({ props }) => ({
    class: [
      {
        "ml-auto sm:ml-2": props.horizontal,
        "ml-auto": !props.horizontal
      }
    ]
  }),
  panel: ({ props }) => ({
    class: [
      // Size
      "w-auto",
      // Spacing
      "py-1",
      "m-0",
      // Shape
      "shadow-none sm:shadow-md",
      "border-0",
      // Color
      "bg-surface-0 dark:bg-surface-700",
      // Position
      "static sm:absolute",
      "z-10",
      {
        "sm:left-full top-0": !props.horizontal
      }
    ]
  }),
  grid: {
    class: "flex flex-wrap sm:flex-nowrap"
  },
  column: {
    class: "w-full sm:w-1/2"
  },
  submenu: {
    class: ["m-0 list-none", "py-1 px-2 w-full sm:min-w-[14rem]"]
  },
  submenuheader: {
    class: [
      "font-semibold",
      // Spacing
      "py-3 px-5",
      "m-0",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-700"
    ]
  },
  separator: {
    class: "border-t border-surface-200 dark:border-surface-600 my-1"
  },
  menubutton: {
    class: [
      // Flexbox
      "flex sm:hidden",
      "items-center justify-center",
      // Size
      "w-8",
      "h-8",
      // Shape
      "rounded-full",
      // Color
      "text-surface-500 dark:text-white/80",
      // States
      "hover:text-surface-600 dark:hover:text-white/60",
      "hover:bg-surface-100 dark:hover:bg-surface-600/80",
      "focus:outline-none focus:outline-offset-0",
      "focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transitions
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-pointer",
      "no-underline"
    ]
  },
  end: {
    class: "ml-auto self-center"
  }
};
const menu = {
  root: {
    class: [
      // Sizing and Shape
      "min-w-[12rem]",
      "rounded-md",
      // Spacing
      "py-2",
      // Colors
      "bg-surface-0 dark:bg-surface-700",
      "text-surface-700 dark:text-white/80",
      "border border-surface-200 dark:border-surface-700"
    ]
  },
  menu: {
    class: [
      // Spacings and Shape
      "list-none",
      "m-0",
      "p-0",
      "outline-none"
    ]
  },
  content: ({ context }) => ({
    class: [
      //Shape
      "rounded-none",
      // Colors
      "text-surface-700 dark:text-white/80",
      {
        "bg-surface-200 text-surface-700 dark:bg-surface-300/10 dark:text-white": context.focused
      },
      // Transitions
      "transition-shadow",
      "duration-200",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:bg-surface-700 dark:hover:bg-surface-400/10"
    ]
  }),
  action: {
    class: [
      "relative",
      // Flexbox
      "flex",
      "items-center",
      // Spacing
      "py-3",
      "px-5",
      // Color
      "text-surface-700 dark:text-white/80",
      // Misc
      "no-underline",
      "overflow-hidden",
      "cursor-pointer",
      "select-none"
    ]
  },
  icon: {
    class: [
      // Spacing
      "mr-2",
      // Color
      "text-surface-600 dark:text-white/70"
    ]
  },
  label: {
    class: ["leading-none"]
  },
  submenuheader: {
    class: [
      // Font
      "font-bold",
      // Spacing
      "m-0",
      "py-3 px-5",
      // Shape
      "rounded-tl-none",
      "rounded-tr-none",
      // Colors
      "bg-surface-0 dark:bg-surface-700",
      "text-surface-700 dark:text-white"
    ]
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const menubar = {
  root: {
    class: [
      "relative",
      // Flexbox
      "flex",
      "items-center",
      // Spacing
      "p-2",
      // Shape
      "rounded-md",
      // Color
      "bg-surface-50 dark:bg-surface-700",
      "border border-surface-200 dark:border-surface-700"
    ]
  },
  menu: ({ props }) => ({
    class: [
      // Flexbox
      "sm:flex",
      "items-center",
      "flex-wrap",
      "flex-col sm:flex-row",
      { hidden: !(props == null ? void 0 : props.mobileActive), flex: props == null ? void 0 : props.mobileActive },
      // Position
      "absolute sm:relative",
      "top-full left-0",
      "sm:top-auto sm:left-auto",
      // Size
      "w-full sm:w-auto",
      // Spacing
      "m-0",
      "py-1 sm:py-0 sm:p-0",
      "list-none",
      // Shape
      "shadow-md sm:shadow-none",
      "border-0",
      // Color
      "bg-surface-0 dark:bg-surface-700 sm:bg-transparent",
      // Misc
      "outline-none"
    ]
  }),
  menuitem: {
    class: "sm:relative sm:w-auto w-full static"
  },
  content: ({ props, context }) => ({
    class: [
      // Shape
      { "rounded-md": props.root },
      //  Colors
      {
        "text-surface-500 dark:text-white/70": !context.focused && !context.active,
        "text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-surface-600/90": context.focused && !context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": context.focused && context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": !context.focused && context.active
      },
      // Hover States
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.active,
        "hover:bg-primary-500/50 dark:hover:bg-primary-300/30 text-primary-700 dark:text-surface-0/80": context.active
      },
      // Transitions
      "transition-all",
      "duration-200"
    ]
  }),
  action: ({ context }) => ({
    class: [
      "relative",
      // Flexbox
      "flex",
      "items-center",
      // Spacing
      "py-3",
      "px-5",
      // Size
      {
        "pl-9 sm:pl-5": context.level === 1,
        "pl-14 sm:pl-5": context.level === 2
      },
      "leading-none",
      // Misc
      "select-none",
      "cursor-pointer",
      "no-underline ",
      "overflow-hidden"
    ]
  }),
  icon: {
    class: "mr-2"
  },
  submenuicon: ({ props }) => ({
    class: [
      {
        "ml-auto sm:ml-2": props.root,
        "ml-auto": !props.root
      }
    ]
  }),
  submenu: ({ props }) => ({
    class: [
      // Size
      "w-full sm:w-48",
      // Spacing
      "py-1",
      "m-0",
      "list-none",
      // Shape
      "shadow-none sm:shadow-md",
      "border-0",
      // Position
      "static sm:absolute",
      "z-10",
      { "sm:absolute sm:left-full sm:top-0": props.level > 1 },
      // Color
      "bg-surface-0 dark:bg-surface-700"
    ]
  }),
  separator: {
    class: "border-t border-surface-200 dark:border-surface-600 my-1"
  },
  button: {
    class: [
      // Flexbox
      "flex sm:hidden",
      "items-center justify-center",
      // Size
      "w-8",
      "h-8",
      // Shape
      "rounded-full",
      // Color
      "text-surface-500 dark:text-white/80",
      // States
      "hover:text-surface-600 dark:hover:text-white/60",
      "hover:bg-surface-100 dark:hover:bg-surface-600/80",
      "focus:outline-none focus:outline-offset-0",
      "focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transitions
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-pointer",
      "no-underline"
    ]
  },
  end: {
    class: "ml-auto self-center"
  }
};
const message = {
  root: ({ props }) => ({
    class: [
      // Spacing and Shape
      "my-4 mx-0",
      "rounded-md",
      "border-solid border-0 border-l-[6px]",
      // Colors
      {
        "bg-blue-100/70 dark:bg-blue-500/20": props.severity == "info",
        "bg-green-100/70 dark:bg-green-500/20": props.severity == "success",
        "bg-orange-100/70 dark:bg-orange-500/20": props.severity == "warn",
        "bg-red-100/70 dark:bg-red-500/20": props.severity == "error"
      },
      {
        "border-blue-500 dark:border-blue-400": props.severity == "info",
        "border-green-500 dark:border-green-400": props.severity == "success",
        "border-orange-500 dark:border-orange-400": props.severity == "warn",
        "border-red-500 dark:border-red-400": props.severity == "error"
      },
      {
        "text-blue-700 dark:text-blue-300": props.severity == "info",
        "text-green-700 dark:text-green-300": props.severity == "success",
        "text-orange-700 dark:text-orange-300": props.severity == "warn",
        "text-red-700 dark:text-red-300": props.severity == "error"
      }
    ]
  }),
  wrapper: {
    class: [
      // Flexbox
      "flex items-center",
      // Spacing
      "py-5 px-7"
    ]
  },
  icon: {
    class: [
      // Sizing and Spacing
      "w-6 h-6",
      "text-lg leading-none mr-2 shrink-0"
    ]
  },
  text: {
    class: [
      // Font and Text
      "text-base leading-none",
      "font-medium"
    ]
  },
  button: {
    class: [
      // Flexbox
      "flex items-center justify-center",
      // Size
      "w-8 h-8",
      // Spacing and Misc
      "ml-auto  relative",
      // Shape
      "rounded-full",
      // Colors
      "bg-transparent",
      // Transitions
      "transition duration-200 ease-in-out",
      // States
      "hover:bg-surface-0/50 dark:hover:bg-surface-0/10",
      // Misc
      "overflow-hidden"
    ]
  },
  transition: {
    enterFromClass: "opacity-0",
    enterActiveClass: "transition-opacity duration-300",
    leaveFromClass: "max-h-40",
    leaveActiveClass: "overflow-hidden transition-all duration-300 ease-in",
    leaveToClass: "max-h-0 opacity-0 !m-0"
  }
};
const multiselect = {
  root: ({ props, state }) => ({
    class: [
      // Display and Position
      "inline-flex",
      "relative",
      // Shape
      "rounded-md",
      // Color and Background
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-700",
      // Transitions
      "transition-all",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-300",
      { "outline-none outline-offset-0 ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
      // Misc
      "cursor-pointer",
      "select-none",
      { "opacity-60": props.disabled, "pointer-events-none": props.disabled, "cursor-default": props.disabled }
    ]
  }),
  labelContainer: {
    class: "overflow-hidden flex flex-auto cursor-pointer "
  },
  label: ({ props }) => {
    var _a, _b;
    return {
      class: [
        "leading-none",
        "block ",
        // Spacing
        {
          "p-3": props.display !== "chip",
          "py-3 px-3": props.display === "chip" && !((_a = props == null ? void 0 : props.modelValue) == null ? void 0 : _a.length),
          "py-1.5 px-3": props.display === "chip" && ((_b = props == null ? void 0 : props.modelValue) == null ? void 0 : _b.length) > 0
        },
        // Color
        { "text-surface-800 dark:text-white/80": props.modelValue, "text-surface-400 dark:text-surface-500": !props.modelValue },
        "placeholder:text-surface-400 dark:placeholder:text-surface-500",
        // Transitions
        "transition duration-200",
        // Misc
        "overflow-hidden whitespace-nowrap cursor-pointer overflow-ellipsis"
      ]
    };
  },
  token: {
    class: [
      // Flex
      "inline-flex items-center",
      // Spacings
      "py-1.5 px-3 mr-2",
      // Shape
      "rounded-[1.14rem]",
      // Colors
      "bg-surface-200 dark:bg-surface-700",
      "text-surface-700 dark:text-white/70",
      // Misc
      "cursor-default"
    ]
  },
  removeTokenIcon: {
    class: [
      // Shape
      "rounded-md leading-6",
      // Spacing
      "ml-2",
      // Size
      "w-4 h-4",
      // Transition
      "transition duration-200 ease-in-out",
      // Misc
      "cursor-pointer"
    ]
  },
  trigger: {
    class: [
      // Flexbox
      "flex items-center justify-center",
      "shrink-0",
      // Color and Background
      "bg-transparent",
      "text-surface-500",
      // Size
      "w-12",
      // Shape
      "rounded-tr-md",
      "rounded-br-md"
    ]
  },
  panel: {
    class: [
      // Position
      "absolute top-0 left-0",
      // Shape
      "border-0 dark:border",
      "rounded-md",
      "shadow-md",
      // Color
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-800 dark:text-white/80",
      "dark:border-surface-700"
    ]
  },
  header: {
    class: [
      "flex items-center justify-between",
      // Spacing
      "py-3 px-5",
      "m-0",
      //Shape
      "border-b",
      "rounded-tl-md",
      "rounded-tr-md",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-100 dark:bg-surface-800",
      "border-surface-300 dark:border-surface-700"
    ]
  },
  headerCheckboxContainer: {
    class: [
      "relative",
      // Alignment
      "inline-flex",
      "align-bottom",
      // Size
      "w-6",
      "h-6",
      // Misc
      "cursor-pointer",
      "select-none"
    ]
  },
  headerCheckbox: {
    root: {
      class: [
        "relative",
        // Alignment
        "inline-flex",
        "align-bottom",
        // Size
        "w-6",
        "h-6",
        // Spacing
        "mr-2",
        // Misc
        "cursor-pointer",
        "select-none"
      ]
    },
    box: ({ props, context }) => ({
      class: [
        // Alignment
        "flex",
        "items-center",
        "justify-center",
        // Size
        "w-6",
        "h-6",
        // Shape
        "rounded-md",
        "border-2",
        // Colors
        {
          "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
          "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
        },
        // States
        {
          "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
          "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
          "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
          "cursor-default opacity-60": props.disabled
        },
        // Transitions
        "transition-colors",
        "duration-200"
      ]
    }),
    input: {
      class: [
        "peer",
        // Size
        "w-full ",
        "h-full",
        // Position
        "absolute",
        "top-0 left-0",
        "z-10",
        // Spacing
        "p-0",
        "m-0",
        // Shape
        "opacity-0",
        "rounded-md",
        "outline-none",
        "border-2 border-surface-200 dark:border-surface-700",
        // Misc
        "appareance-none",
        "cursor-pointer"
      ]
    },
    icon: {
      class: [
        // Font
        "text-base leading-none",
        // Size
        "w-4",
        "h-4",
        // Colors
        "text-white dark:text-surface-900",
        // Transitions
        "transition-all",
        "duration-200"
      ]
    }
  },
  itemCheckbox: {
    root: {
      class: [
        "relative",
        // Alignment
        "inline-flex",
        "align-bottom",
        // Size
        "w-6",
        "h-6",
        // Spacing
        "mr-2",
        // Misc
        "cursor-pointer",
        "select-none"
      ]
    },
    box: ({ props, context }) => ({
      class: [
        // Alignment
        "flex",
        "items-center",
        "justify-center",
        // Size
        "w-6",
        "h-6",
        // Shape
        "rounded-md",
        "border-2",
        // Colors
        {
          "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
          "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
        },
        // States
        {
          "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
          "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
          "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
          "cursor-default opacity-60": props.disabled
        },
        // Transitions
        "transition-colors",
        "duration-200"
      ]
    }),
    input: {
      class: [
        "peer",
        // Size
        "w-full ",
        "h-full",
        // Position
        "absolute",
        "top-0 left-0",
        "z-10",
        // Spacing
        "p-0",
        "m-0",
        // Shape
        "opacity-0",
        "rounded-md",
        "outline-none",
        "border-2 border-surface-200 dark:border-surface-700",
        // Misc
        "appareance-none",
        "cursor-pointer"
      ]
    },
    icon: {
      class: [
        // Font
        "text-base leading-none",
        // Size
        "w-4",
        "h-4",
        // Colors
        "text-white dark:text-surface-900",
        // Transitions
        "transition-all",
        "duration-200"
      ]
    }
  },
  closeButton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "flex items-center justify-center",
      // Size and Spacing
      "mr-2",
      "last:mr-0",
      "w-8 h-8",
      // Shape
      "border-0",
      "rounded-full",
      // Colors
      "text-surface-500",
      "bg-transparent",
      // Transitions
      "transition duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-inset",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "overflow-hidden"
    ]
  },
  closeButtonIcon: {
    class: "w-4 h-4 inline-block"
  },
  wrapper: {
    class: [
      // Sizing
      "max-h-[200px]",
      // Misc
      "overflow-auto"
    ]
  },
  list: {
    class: "py-3 list-none m-0"
  },
  item: ({ context }) => ({
    class: [
      // Font
      "font-normal",
      "leading-none",
      // Flexbox
      "flex items-center",
      // Position
      "relative",
      // Shape
      "border-0",
      "rounded-none",
      // Spacing
      "m-0",
      "py-3 px-5",
      // Color
      { "text-surface-700 dark:text-white/80": !context.focused && !context.selected },
      { "bg-surface-200 dark:bg-surface-600/60 text-surface-700 dark:text-white/80": context.focused && !context.selected },
      { "bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context.focused && context.selected },
      { "bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": !context.focused && context.selected },
      //States
      { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.focused && !context.selected },
      { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": context.focused && !context.selected },
      // Transitions
      "transition-shadow",
      "duration-200",
      // Misc
      "cursor-pointer",
      "overflow-hidden",
      "whitespace-nowrap"
    ]
  }),
  itemgroup: {
    class: [
      //Font
      "font-bold",
      // Spacing
      "m-0",
      "p-3 px-5",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-600/80",
      // Misc
      "cursor-auto"
    ]
  },
  filtercontainer: {
    class: "relative w-full mx-2"
  },
  filterinput: {
    class: [
      // Font
      "font-sans",
      "leading-none",
      // Sizing
      "pr-7 py-3 px-3",
      "-mr-7",
      "w-full",
      //Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-900",
      "border-surface-200 dark:border-surface-700",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      // Shape
      "border",
      "rounded-lg",
      "appearance-none",
      // Transitions
      "transition",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-300",
      "focus:ring focus:outline-none focus:outline-offset-0",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "appearance-none"
    ]
  },
  filtericon: {
    class: ["absolute", "top-1/2 right-3", "-mt-2"]
  },
  clearicon: {
    class: [
      // Color
      "text-surface-500",
      // Position
      "absolute",
      "top-1/2",
      "right-12",
      // Spacing
      "-mt-2"
    ]
  },
  emptymessage: {
    class: [
      // Font
      "leading-none",
      // Spacing
      "py-3 px-5",
      // Color
      "text-surface-800 dark:text-white/80",
      "bg-transparent"
    ]
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const orderlist = {
  root: {
    class: [
      // Flexbox
      "flex"
    ]
  },
  controls: {
    class: [
      // Flexbox & Alignment
      "flex flex-col justify-center gap-2",
      // Spacing
      "p-5"
    ]
  },
  moveupbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  movedownbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  movetopbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  movebottombutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  container: {
    class: ["flex-auto"]
  },
  header: {
    class: [
      "font-bold",
      // Shape
      "border-b-0 rounded-t-md",
      // Spacing
      "p-5",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-50 dark:bg-surface-800",
      "border border-surface-200 dark:border-surface-700"
    ]
  },
  list: {
    class: [
      // Spacing
      "list-none m-0 p-0",
      // Size
      "min-h-[12rem] max-h-[24rem]",
      // Shape
      "rounded-b-md",
      // Color
      "text-surface-600 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-800",
      "border border-surface-200 dark:border-surface-700",
      // Spacing
      "py-3 px-0",
      // Focus & Outline
      "outline-none",
      // Misc
      "overflow-auto"
    ]
  },
  item: ({ context }) => ({
    class: [
      // Position
      "relative",
      // Spacing
      "py-3 px-5 m-0",
      // Shape
      "border-none",
      // Transition
      "transition duration-200",
      // Color
      "text-surface-700 dark:text-white/80",
      { "bg-primary-500/20 dark:bg-primary-300/20": context.active && !context.focused },
      { "bg-primary-500/30 dark:bg-primary-400/30": context.active && context.focused },
      { "bg-surface-100 dark:bg-surface-700/70": !context.active && context.focused },
      // State
      "hover:bg-surface-100 dark:hover:bg-surface-700",
      // Misc
      "cursor-pointer overflow-hidden"
    ]
  })
};
const organizationchart = {
  table: {
    class: [
      // Spacing & Position
      "mx-auto my-0",
      // Table Style
      "border-spacing-0 border-separate"
    ]
  },
  cell: {
    class: [
      // Alignment
      "text-center align-top",
      // Spacing
      "py-0 px-3"
    ]
  },
  node: ({ props, context }) => ({
    class: [
      "relative inline-block",
      // Spacing
      "p-5",
      // Shape
      "border",
      // Color
      {
        "text-surface-600 dark:text-white/80": !(context == null ? void 0 : context.selected),
        "bg-surface-0 dark:bg-surface-800": !(context == null ? void 0 : context.selected),
        "border-surface-200 dark:border-surface-700": !(context == null ? void 0 : context.selected),
        "text-primary-700 dark:text-surface-0": context == null ? void 0 : context.selected,
        "bg-primary-50 dark:bg-primary-400/30": context == null ? void 0 : context.selected,
        "border-primary-200 dark:border-primary-600": context == null ? void 0 : context.selected
      },
      // States
      {
        "hover:bg-surface-100 dark:hover:bg-surface-700": (context == null ? void 0 : context.selectable) && !(context == null ? void 0 : context.selected),
        "hover:bg-primary-100 dark:hover:bg-primary-300/30": (context == null ? void 0 : context.selectable) && (context == null ? void 0 : context.selected)
      },
      { "cursor-pointer": context == null ? void 0 : context.selectable }
    ]
  }),
  linecell: {
    class: [
      // Alignment
      "text-center align-top",
      // Spacing
      "py-0 px-3"
    ]
  },
  linedown: {
    class: [
      // Spacing
      "mx-auto my-0",
      // Size
      "w-px h-[20px]",
      // Color
      "bg-surface-200 dark:bg-surface-700"
    ]
  },
  lineleft: ({ context }) => ({
    class: [
      // Alignment
      "text-center align-top",
      // Spacing
      "py-0 px-3",
      // Shape
      "rounded-none border-r",
      { "border-t": context.lineTop },
      // Color
      "border-surface-200 dark:border-surface-700"
    ]
  }),
  lineright: ({ context }) => ({
    class: [
      // Alignment
      "text-center align-top",
      // Spacing
      "py-0 px-3",
      // Shape
      "rounded-none",
      // Color
      { "border-t border-surface-200 dark:border-surface-700": context.lineTop }
    ]
  }),
  nodecell: {
    class: "text-center align-top py-0 px-3"
  },
  nodetoggler: {
    class: [
      // Position
      "absolute bottom-[-0.75rem] left-2/4 -ml-3",
      "z-20",
      // Flexbox
      "flex items-center justify-center",
      // Size
      "w-6 h-6",
      // Shape
      "rounded-full",
      // Color
      "bg-inherit text-inherit",
      // Focus
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "cursor-pointer no-underline select-none"
    ]
  },
  nodetogglericon: {
    class: [
      // Position
      "relative inline-block",
      // Size
      "w-4 h-4"
    ]
  }
};
const overlaypanel = {
  root: {
    class: [
      // Shape
      "rounded-md shadow-lg",
      "border-0 dark:border",
      // Position
      "absolute left-0 top-0 mt-2",
      "z-40 transform origin-center",
      // Color
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-surface-0/80",
      "dark:border-surface-700",
      // Before: Triangle
      "before:absolute before:-top-[9px] before:-ml-[9px] before:left-[calc(var(--overlayArrowLeft,0)+1.25rem)] z-0",
      "before:w-0 before:h-0",
      "before:border-transparent before:border-solid",
      "before:border-x-[8px] before:border-[8px]",
      "before:border-t-0 before:border-b-surface-300/10 dark:before:border-b-surface-700",
      "after:absolute after:-top-2 after:-ml-[8px] after:left-[calc(var(--overlayArrowLeft,0)+1.25rem)]",
      "after:w-0 after:h-0",
      "after:border-transparent after:border-solid",
      "after:border-x-[0.5rem] after:border-[0.5rem]",
      "after:border-t-0 after:border-b-surface-0 dark:after:border-b-surface-800"
    ]
  },
  content: {
    class: "p-5 items-center flex"
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const paginator = {
  root: {
    class: [
      // Flex & Alignment
      "flex items-center justify-center flex-wrap",
      // Spacing
      "px-4 py-2",
      // Shape
      "border-0",
      // Color
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-500 dark:text-white/60"
    ]
  },
  firstpagebutton: ({ context }) => ({
    class: [
      "relative",
      // Flex & Alignment
      "inline-flex items-center justify-center",
      // Shape
      "border-0 rounded-full dark:rounded-md",
      // Size
      "min-w-[3rem] h-12 m-[0.143rem]",
      "leading-none",
      // Color
      "text-surface-500 dark:text-white/60",
      // State
      {
        "hover:bg-surface-50 dark:hover:bg-surface-700/70": !context.disabled,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !context.disabled
      },
      // Transition
      "transition duration-200",
      // Misc
      "user-none overflow-hidden",
      { "cursor-default pointer-events-none opacity-60": context.disabled }
    ]
  }),
  previouspagebutton: ({ context }) => ({
    class: [
      "relative",
      // Flex & Alignment
      "inline-flex items-center justify-center",
      // Shape
      "border-0 rounded-full dark:rounded-md",
      // Size
      "min-w-[3rem] h-12 m-[0.143rem]",
      "leading-none",
      // Color
      "text-surface-500 dark:text-white/60",
      // State
      {
        "hover:bg-surface-50 dark:hover:bg-surface-700/70": !context.disabled,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !context.disabled
      },
      // Transition
      "transition duration-200",
      // Misc
      "user-none overflow-hidden",
      { "cursor-default pointer-events-none opacity-60": context.disabled }
    ]
  }),
  nextpagebutton: ({ context }) => ({
    class: [
      "relative",
      // Flex & Alignment
      "inline-flex items-center justify-center",
      // Shape
      "border-0 rounded-full dark:rounded-md",
      // Size
      "min-w-[3rem] h-12 m-[0.143rem]",
      "leading-none",
      // Color
      "text-surface-500 dark:text-white/60",
      // State
      {
        "hover:bg-surface-50 dark:hover:bg-surface-700/70": !context.disabled,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !context.disabled
      },
      // Transition
      "transition duration-200",
      // Misc
      "user-none overflow-hidden",
      { "cursor-default pointer-events-none opacity-60": context.disabled }
    ]
  }),
  lastpagebutton: ({ context }) => ({
    class: [
      "relative",
      // Flex & Alignment
      "inline-flex items-center justify-center",
      // Shape
      "border-0 rounded-full dark:rounded-md",
      // Size
      "min-w-[3rem] h-12 m-[0.143rem]",
      "leading-none",
      // Color
      "text-surface-500 dark:text-white/60",
      // State
      {
        "hover:bg-surface-50 dark:hover:bg-surface-700/70": !context.disabled,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !context.disabled
      },
      // Transition
      "transition duration-200",
      // Misc
      "user-none overflow-hidden",
      { "cursor-default pointer-events-none opacity-60": context.disabled }
    ]
  }),
  pagebutton: ({ context }) => ({
    class: [
      "relative",
      // Flex & Alignment
      "inline-flex items-center justify-center",
      // Shape
      "border-0 rounded-full dark:rounded-md",
      // Size
      "min-w-[3rem] h-12 m-[0.143rem]",
      "leading-none",
      // Color
      "text-surface-500 dark:text-white/80",
      {
        "bg-primary-50 border-primary-50 dark:border-transparent text-primary-700 dark:text-surface-0 dark:bg-primary-400/30": context.active
      },
      // State
      {
        "hover:bg-surface-50 dark:hover:bg-surface-700/70": !context.disabled && !context.active,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !context.disabled
      },
      // Transition
      "transition duration-200",
      // Misc
      "user-none overflow-hidden",
      { "cursor-default pointer-events-none opacity-60": context.disabled }
    ]
  }),
  rowperpagedropdown: {
    root: ({ props, state }) => ({
      class: [
        // Display and Position
        "inline-flex",
        "relative",
        // Shape
        "h-12",
        "rounded-md",
        // Spacing
        "mx-2",
        // Color and Background
        "bg-surface-0 dark:bg-surface-900",
        "border border-surface-300 dark:border-surface-700",
        // Transitions
        "transition-all",
        "duration-200",
        // States
        "hover:border-primary-500 dark:hover:border-primary-300",
        { "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !state.focused },
        // Misc
        "cursor-pointer",
        "select-none",
        { "opacity-60": props.disabled, "pointer-events-none": props.disabled, "cursor-default": props.disabled }
      ]
    }),
    input: {
      class: [
        //Font
        "font-sans",
        "leading-5",
        // Display
        "block",
        "flex-auto",
        // Color and Background
        "bg-transparent",
        "border-0",
        "text-surface-800 dark:text-white/80",
        // Sizing and Spacing
        "w-[1%]",
        "p-3 pr-0",
        //Shape
        "rounded-none",
        // Transitions
        "transition",
        "duration-200",
        // States
        "focus:outline-none focus:shadow-none",
        // Misc
        "relative",
        "cursor-pointer",
        "overflow-hidden overflow-ellipsis",
        "whitespace-nowrap",
        "appearance-none"
      ]
    },
    trigger: {
      class: [
        // Flexbox
        "flex items-center justify-center",
        "shrink-0",
        // Color and Background
        "bg-transparent",
        "text-surface-500",
        // Size
        "w-12",
        // Shape
        "rounded-tr-md",
        "rounded-br-md"
      ]
    },
    panel: {
      class: [
        // Position
        "absolute top-0 left-0",
        // Shape
        "border-0 dark:border",
        "rounded-md",
        "shadow-md",
        // Color
        "bg-surface-0 dark:bg-surface-800",
        "text-surface-800 dark:text-white/80",
        "dark:border-surface-700"
      ]
    },
    wrapper: {
      class: [
        // Sizing
        "max-h-[200px]",
        // Misc
        "overflow-auto"
      ]
    },
    list: {
      class: "py-3 list-none m-0"
    },
    item: ({ context }) => ({
      class: [
        // Font
        "font-normal",
        "leading-none",
        // Position
        "relative",
        // Shape
        "border-0",
        "rounded-none",
        // Spacing
        "m-0",
        "py-3 px-5",
        // Color
        { "text-surface-700 dark:text-white/80": !context.focused && !context.selected },
        { "bg-surface-50 dark:bg-surface-600/60 text-surface-700 dark:text-white/80": context.focused && !context.selected },
        { "bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context.focused && context.selected },
        { "bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": !context.focused && context.selected },
        //States
        { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.focused && !context.selected },
        { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": context.focused && !context.selected },
        // Transitions
        "transition-shadow",
        "duration-200",
        // Misc
        "cursor-pointer",
        "overflow-hidden",
        "whitespace-nowrap"
      ]
    })
  },
  jumptopageinput: {
    root: {
      class: "inline-flex mx-2"
    },
    input: {
      root: {
        class: [
          "relative",
          //Font
          "font-sans",
          "leading-none",
          // Display
          "block",
          "flex-auto",
          // Colors
          "text-surface-600 dark:text-surface-200",
          "placeholder:text-surface-400 dark:placeholder:text-surface-500",
          "bg-surface-0 dark:bg-surface-900",
          "border border-surface-300 dark:border-surface-600",
          // Sizing and Spacing
          "w-[1%] max-w-[3rem]",
          "p-3 m-0",
          //Shape
          "rounded-md",
          // Transitions
          "transition",
          "duration-200",
          // States
          "hover:border-primary-500 dark:hover:border-primary-400",
          "focus:outline-none focus:shadow-none",
          "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50",
          // Misc
          "cursor-pointer",
          "overflow-hidden overflow-ellipsis",
          "whitespace-nowrap",
          "appearance-none"
        ]
      }
    }
  },
  jumptopagedropdown: {
    root: ({ props, state }) => ({
      class: [
        // Display and Position
        "inline-flex",
        "relative",
        // Shape
        "h-12",
        "rounded-md",
        // Color and Background
        "bg-surface-0 dark:bg-surface-900",
        "border border-surface-300 dark:border-surface-700",
        // Transitions
        "transition-all",
        "duration-200",
        // States
        "hover:border-primary-500 dark:hover:border-primary-300",
        { "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !state.focused },
        // Misc
        "cursor-pointer",
        "select-none",
        { "opacity-60": props.disabled, "pointer-events-none": props.disabled, "cursor-default": props.disabled }
      ]
    }),
    input: {
      class: [
        //Font
        "font-sans",
        "leading-none",
        // Display
        "block",
        "flex-auto",
        // Color and Background
        "bg-transparent",
        "border-0",
        "text-surface-800 dark:text-white/80",
        // Sizing and Spacing
        "w-[1%]",
        "p-3",
        //Shape
        "rounded-none",
        // Transitions
        "transition",
        "duration-200",
        // States
        "focus:outline-none focus:shadow-none",
        // Misc
        "relative",
        "cursor-pointer",
        "overflow-hidden overflow-ellipsis",
        "whitespace-nowrap",
        "appearance-none"
      ]
    },
    trigger: {
      class: [
        // Flexbox
        "flex items-center justify-center",
        "shrink-0",
        // Color and Background
        "bg-transparent",
        "text-surface-500",
        // Size
        "w-12",
        // Shape
        "rounded-tr-md",
        "rounded-br-md"
      ]
    },
    panel: {
      class: [
        // Position
        "absolute top-0 left-0",
        // Shape
        "border-0 dark:border",
        "rounded-md",
        "shadow-md",
        // Color
        "bg-surface-0 dark:bg-surface-800",
        "text-surface-800 dark:text-white/80",
        "dark:border-surface-700"
      ]
    },
    wrapper: {
      class: [
        // Sizing
        "max-h-[200px]",
        // Misc
        "overflow-auto"
      ]
    },
    list: {
      class: "py-3 list-none m-0"
    },
    item: ({ context }) => ({
      class: [
        // Font
        "font-normal",
        "leading-none",
        // Position
        "relative",
        // Shape
        "border-0",
        "rounded-none",
        // Spacing
        "m-0",
        "py-3 px-5",
        // Color
        { "text-surface-700 dark:text-white/80": !context.focused && !context.selected },
        { "bg-surface-50 dark:bg-surface-600/60 text-surface-700 dark:text-white/80": context.focused && !context.selected },
        { "bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": context.focused && context.selected },
        { "bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80": !context.focused && context.selected },
        //States
        { "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.focused && !context.selected },
        { "hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80": context.focused && !context.selected },
        // Transitions
        "transition-shadow",
        "duration-200",
        // Misc
        "cursor-pointer",
        "overflow-hidden",
        "whitespace-nowrap"
      ]
    })
  }
};
const panel = {
  header: ({ props }) => ({
    class: [
      // Flex
      "flex items-center justify-between",
      // Colors
      "text-surface-700 dark:text-surface-0/80",
      "bg-surface-50 dark:bg-surface-900",
      "border border-surface-200 dark:border-surface-700",
      //Shape
      "rounded-tl-lg rounded-tr-lg",
      // Conditional Spacing
      { "p-5": !props.toggleable, "py-3 px-5": props.toggleable }
    ]
  }),
  title: {
    class: "leading-none font-bold"
  },
  toggler: {
    class: [
      // Alignments
      "inline-flex items-center justify-center",
      "relative",
      // Sized
      "w-8 h-8",
      "m-0 p-0",
      //Shape
      "border-0 rounded-full",
      //Color
      "bg-transparent",
      "text-surface-600 dark:text-surface-0/80",
      // States
      "hover:text-surface-800 dark:hover:text-surface-0/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      "focus:outline-none focus:outline-offset-0 focus-visible:ring focus-visible:ring-primary-400/50 focus-visible:ring-inset dark:focus-visible:ring-primary-300/50",
      // Transitions
      "transition-all duration-200 ease-in-out",
      // Misc
      "overflow-hidden no-underline",
      "cursor-pointer"
    ]
  },
  togglerIcon: {
    class: "inline-block"
  },
  content: {
    class: [
      // Spacing
      "p-5",
      // Shape
      "border border-t-0 last:rounded-br-lg last:rounded-bl-lg",
      //Color
      "border-surface-200 dark:border-surface-700",
      "bg-surface-0 dark:bg-surface-900",
      "text-surface-700 dark:text-surface-0/80"
    ]
  },
  footer: {
    class: [
      // Spacing
      "py-3 p-5",
      // Shape
      "border border-t-0 rounded-br-lg rounded-bl-lg",
      //Color
      "border-surface-200 dark:border-surface-700",
      "bg-surface-0 dark:bg-surface-900",
      "text-surface-700 dark:text-surface-0/80"
    ]
  },
  transition: {
    enterFromClass: "max-h-0",
    enterActiveClass: "overflow-hidden transition-[max-height] duration-1000 ease-[cubic-bezier(0.42,0,0.58,1)]",
    enterToClass: "max-h-[1000px]",
    leaveFromClass: "max-h-[1000px]",
    leaveActiveClass: "overflow-hidden transition-[max-height] duration-[450ms] ease-[cubic-bezier(0,1,0,1)]",
    leaveToClass: "max-h-0"
  }
};
const panelmenu = {
  panel: {
    class: "mb-1"
  },
  header: {
    class: ["rounded-md", "outline-none", "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50"]
  },
  headercontent: ({ context, instance }) => {
    var _a, _b;
    return {
      class: [
        // Shape
        "rounded-t-md",
        { "rounded-br-md rounded-bl-md": !context.active || ((_a = instance.activeItem) == null ? void 0 : _a.items) === void 0, "rounded-br-0 rounded-bl-0": context.active && ((_b = instance.activeItem) == null ? void 0 : _b.items) !== void 0 },
        // Color
        "border border-surface-200 dark:border-surface-700",
        "bg-surface-50 dark:bg-surface-800",
        "text-surface-600 dark:text-surface-0/80",
        { "text-surface-900": context.active },
        // States
        "hover:bg-surface-100 dark:hover:bg-surface-700/80",
        "hover:text-surface-900",
        // Transition
        "transition duration-200 ease-in-out",
        "transition-shadow duration-200"
      ]
    };
  },
  headeraction: {
    class: [
      "relative",
      // Font
      "font-bold",
      "leading-none",
      // Flex & Alignments
      "flex items-center",
      // Spacing
      "p-5",
      // Misc
      "select-none cursor-pointer no-underline"
    ]
  },
  headerlabel: {
    class: "leading-none"
  },
  headerIcon: {
    class: "mr-2"
  },
  submenuicon: {
    class: "mr-2"
  },
  menucontent: {
    class: [
      // Spacing
      "py-2",
      // Shape
      "border border-t-0",
      "rounded-t-none rounded-br-md rounded-bl-md",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700"
    ]
  },
  menu: {
    class: ["outline-none", "m-0 p-0 list-none"]
  },
  content: {
    class: [
      // Shape
      "border-none rounded-none",
      // Color
      "text-surface-700 dark:text-white/80",
      // Transition
      "transition-shadow duration-200"
    ]
  },
  action: ({ context }) => ({
    class: [
      "relative",
      // Font
      "leading-none",
      // Flex & Alignments
      "flex items-center",
      // Spacing
      "py-3 px-5",
      // Color
      "text-surface-700 dark:text-white/80",
      // States
      "hover:bg-surface-100 dark:hover:bg-surface-700/80 hover:text-surface-700 dark:hover:text-white/80",
      {
        "bg-surface-200 text-surface-700 dark:text-white/80 dark:bg-surface-600/90": context.focused
      },
      // Misc
      "cursor-pointer no-underline",
      "select-none overflow-hidden"
    ]
  }),
  icon: {
    class: "mr-2"
  },
  submenu: {
    class: "p-0 pl-4 m-0 list-none"
  },
  transition: {
    enterFromClass: "max-h-0",
    enterActiveClass: "overflow-hidden transition-[max-height] duration-1000 ease-[cubic-bezier(0.42,0,0.58,1)]",
    enterToClass: "max-h-[1000px]",
    leaveFromClass: "max-h-[1000px]",
    leaveActiveClass: "overflow-hidden transition-[max-height] duration-[450ms] ease-[cubic-bezier(0,1,0,1)]",
    leaveToClass: "max-h-0"
  }
};
const password = {
  root: ({ props }) => ({
    class: [
      "inline-flex relative",
      {
        "opacity-60 select-none pointer-events-none cursor-default": props.disabled
      }
    ]
  }),
  panel: {
    class: [
      // Spacing
      "p-5",
      // Shape
      "border-0 dark:border",
      "shadow-md rounded-md",
      // Colors
      "bg-surface-0 dark:bg-surface-900",
      "text-surface-700 dark:text-white/80",
      "dark:border-surface-700"
    ]
  },
  meter: {
    class: [
      // Position and Overflow
      "overflow-hidden",
      "relative",
      // Shape and Size
      "border-0",
      "h-3",
      // Spacing
      "mb-2",
      // Colors
      "bg-surface-100 dark:bg-surface-700"
    ]
  },
  meterlabel: ({ instance }) => {
    var _a, _b, _c;
    return {
      class: [
        // Size
        "h-full",
        // Colors
        {
          "bg-red-500 dark:bg-red-400/50": ((_a = instance == null ? void 0 : instance.meter) == null ? void 0 : _a.strength) == "weak",
          "bg-orange-500 dark:bg-orange-400/50": ((_b = instance == null ? void 0 : instance.meter) == null ? void 0 : _b.strength) == "medium",
          "bg-green-500 dark:bg-green-400/50": ((_c = instance == null ? void 0 : instance.meter) == null ? void 0 : _c.strength) == "strong"
        },
        // Transitions
        "transition-all duration-1000 ease-in-out"
      ]
    };
  },
  showicon: {
    class: ["absolute top-1/2 right-3 -mt-2", "text-surface-600 dark:text-white/70"]
  },
  hideicon: {
    class: ["absolute top-1/2 right-3 -mt-2", "text-surface-600 dark:text-white/70"]
  },
  input: {
    root: ({ props, context, parent }) => ({
      class: [
        // Font
        "font-sans leading-none",
        // Flex
        { "flex-1 w-[1%]": parent.instance.$name == "InputGroup" },
        // Spacing
        "m-0",
        {
          "px-4 py-4": props.size == "large",
          "px-2 py-2": props.size == "small",
          "p-3": props.size == null
        },
        // Shape
        { "rounded-md": parent.instance.$name !== "InputGroup" },
        { "first:rounded-l-md rounded-none last:rounded-r-md": parent.instance.$name == "InputGroup" },
        { "border-0 border-y border-l last:border-r": parent.instance.$name == "InputGroup" },
        { "first:ml-0 ml-[-1px]": parent.instance.$name == "InputGroup" && !props.showButtons },
        // Colors
        "text-surface-600 dark:text-surface-200",
        "placeholder:text-surface-400 dark:placeholder:text-surface-500",
        "bg-surface-0 dark:bg-surface-900",
        "border border-surface-300 dark:border-surface-600",
        // States
        {
          "hover:border-primary-500 dark:hover:border-primary-400": !context.disabled,
          "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50 focus:z-10": !context.disabled,
          "opacity-60 select-none pointer-events-none cursor-default": context.disabled
        },
        // Misc
        "appearance-none",
        "transition-colors duration-200"
      ]
    })
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const picklist = {
  root: {
    class: [
      // Flexbox
      "flex lg:flex-row flex-col"
    ]
  },
  sourcecontrols: {
    class: [
      // Flexbox & Alignment
      "flex lg:flex-col justify-center gap-2",
      // Spacing
      "p-5"
    ]
  },
  sourcemoveupbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  sourcemovetopbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  sourcemovedownbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  sourcemovebottombutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  sourcewrapper: {
    class: "grow shrink basis-2/4"
  },
  sourceheader: {
    class: [
      "font-bold",
      // Shape
      "border-b-0 rounded-t-md",
      // Spacing
      "p-5",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-50 dark:bg-surface-800",
      "border border-surface-200 dark:border-surface-700"
    ]
  },
  sourcelist: {
    class: [
      // Spacing
      "list-none m-0 p-0",
      // Size
      "min-h-[12rem] max-h-[24rem]",
      // Shape
      "rounded-b-md",
      // Color
      "text-surface-600 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-800",
      "border border-surface-200 dark:border-surface-700",
      // Spacing
      "py-3 px-0",
      // Focus & Outline
      "outline-none",
      // Misc
      "overflow-auto"
    ]
  },
  item: ({ context }) => ({
    class: [
      // Position
      "relative",
      // Spacing
      "py-3 px-5 m-0",
      // Shape
      "border-none",
      // Transition
      "transition duration-200",
      // Color
      "text-surface-700 dark:text-white/80",
      { "bg-primary-500/20 dark:bg-primary-300/20": context.active && !context.focused },
      { "bg-primary-500/30 dark:bg-primary-400/30": context.active && context.focused },
      { "bg-surface-100 dark:bg-surface-700/70": !context.active && context.focused },
      // State
      "hover:bg-surface-100 dark:hover:bg-surface-700",
      // Misc
      "cursor-pointer overflow-hidden"
    ]
  }),
  buttons: {
    class: "flex lg:flex-col justify-center gap-2 p-5"
  },
  movetotargetbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  movealltotargetbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  movetosourcebutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  movealltosourcebutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  targetcontrols: {
    class: "flex lg:flex-col justify-center gap-2 p-5"
  },
  targetmoveupbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  targetmovetopbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  targetmovedownbutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  targetmovebottombutton: {
    root: ({ context }) => ({
      class: [
        // Flexbox & Alignment
        "relative inline-flex items-center justify-center",
        // Shape
        "rounded-md",
        // Color
        "text-white dark:text-surface-900",
        "bg-primary-500 dark:bg-primary-400",
        "border border-primary-500 dark:border-primary-400",
        // Spacing & Size
        "w-12",
        "m-0",
        "px-0 py-3",
        // Transitions
        "transition duration-200 ease-in-out",
        // State
        "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300",
        "focus:outline-none focus:outline-offset-0 focus:ring",
        "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        { "cursor-default pointer-events-none opacity-60": context.disabled },
        // Interactivity
        "cursor-pointer user-select-none"
      ]
    }),
    label: {
      class: [
        // Flexbox
        "flex-initial",
        // Size
        "w-0"
      ]
    }
  },
  targetwrapper: {
    class: "grow shrink basis-2/4"
  },
  targetheader: {
    class: [
      "font-bold",
      // Shape
      "border-b-0 rounded-t-md",
      // Spacing
      "p-5",
      // Color
      "text-surface-700 dark:text-white/80",
      "bg-surface-50 dark:bg-surface-800",
      "border border-surface-200 dark:border-surface-700"
    ]
  },
  targetlist: {
    class: [
      // Spacing
      "list-none m-0 p-0",
      // Size
      "min-h-[12rem] max-h-[24rem]",
      // Shape
      "rounded-b-md",
      // Color
      "text-surface-600 dark:text-white/80",
      "bg-surface-0 dark:bg-surface-800",
      "border border-surface-200 dark:border-surface-700",
      // Spacing
      "py-3 px-0",
      // Focus & Outline
      "outline-none",
      // Misc
      "overflow-auto"
    ]
  },
  transition: {
    enterFromClass: "!transition-none",
    enterActiveClass: "!transition-none",
    leaveActiveClass: "!transition-none",
    leaveToClass: "!transition-none"
  }
};
const progressbar = {
  root: {
    class: [
      // Position and Overflow
      "overflow-hidden",
      "relative",
      // Shape and Size
      "border-0",
      "h-6",
      "rounded-md",
      // Colors
      "bg-surface-100 dark:bg-surface-700"
    ]
  },
  value: ({ props }) => ({
    class: [
      // Flexbox & Overflow & Position
      { "absolute flex items-center justify-center overflow-hidden": props.mode !== "indeterminate" },
      // Colors
      "bg-primary-500 dark:bg-primary-400",
      // Spacing & Sizing
      "m-0",
      { "h-full w-0": props.mode !== "indeterminate" },
      // Shape
      "border-0",
      // Transitions
      {
        "transition-width duration-1000 ease-in-out": props.mode !== "indeterminate",
        "progressbar-value-animate": props.mode == "indeterminate"
      },
      // Before & After (indeterminate)
      {
        "before:absolute before:top-0 before:left-0 before:bottom-0 before:bg-inherit ": props.mode == "indeterminate",
        "after:absolute after:top-0 after:left-0 after:bottom-0 after:bg-inherit after:delay-1000": props.mode == "indeterminate"
      }
    ]
  }),
  label: {
    class: [
      // Flexbox
      "inline-flex",
      // Font and Text
      "text-white dark:text-surface-900",
      "leading-6"
    ]
  }
};
const radiobutton = {
  root: {
    class: [
      "relative",
      // Flexbox & Alignment
      "inline-flex",
      "align-bottom",
      // Size
      "w-[1.571rem] h-[1.571rem]",
      // Misc
      "cursor-pointer",
      "select-none"
    ]
  },
  box: ({ props }) => ({
    class: [
      // Flexbox
      "flex justify-center items-center",
      // Size
      "w-[1.571rem] h-[1.571rem]",
      // Shape
      "border-2",
      "rounded-full",
      // Transition
      "transition duration-200 ease-in-out",
      // Colors
      {
        "text-surface-700 dark:text-white/80": props.value !== props.modelValue && props.value !== void 0,
        "bg-surface-0 dark:bg-surface-900": props.value !== props.modelValue && props.value !== void 0,
        "border-surface-300 dark:border-surface-700": props.value !== props.modelValue && props.value !== void 0,
        "border-primary-500 dark:border-primary-400": props.value == props.modelValue && props.value !== void 0,
        "bg-primary-500 dark:bg-primary-400": props.value == props.modelValue && props.value !== void 0
      },
      // States
      {
        "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled,
        "peer-hover:border-primary-600 dark:peer-hover:border-primary-300 peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300": !props.disabled && props.value == props.modelValue && props.value !== void 0,
        "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
        "opacity-60 cursor-default": props.disabled
      }
    ]
  }),
  input: {
    class: [
      "peer",
      // Size
      "w-full ",
      "h-full",
      // Position
      "absolute",
      "top-0 left-0",
      "z-10",
      // Spacing
      "p-0",
      "m-0",
      // Shape
      "opacity-0",
      "rounded-md",
      "outline-none",
      "border-2 border-surface-200 dark:border-surface-700",
      // Misc
      "appareance-none",
      "cursor-pointer"
    ]
  },
  icon: ({ props }) => ({
    class: [
      "block",
      // Shape
      "rounded-full",
      // Size
      "w-[0.857rem] h-[0.857rem]",
      // Colors
      "bg-surface-0 dark:bg-surface-900",
      // Conditions
      {
        "backface-hidden scale-10 invisible": props.value !== props.modelValue,
        "transform visible scale-[1.1]": props.value == props.modelValue
      },
      // Transition
      "transition duration-200"
    ]
  })
};
const rating = {
  root: ({ props }) => ({
    class: [
      "relative",
      // Flex & Alignment
      "flex items-center",
      "gap-2",
      // Misc
      {
        "opacity-60 select-none pointer-events-none cursor-default": props.disabled
      }
    ]
  }),
  cancelitem: ({ context }) => ({
    class: [
      // Flex & Alignment
      "inline-flex items-center",
      //State
      {
        "outline-none ring ring-primary-500/50 dark:ring-primary-400/50": context.focused
      },
      // Misc
      "cursor-pointer"
    ]
  }),
  cancelicon: {
    class: [
      // Size
      "w-5 h-5",
      // Color
      "text-red-500 dark:text-red-400",
      // State
      "hover:text-red-600 dark:hover:text-red-300",
      // Transition
      "transition duration-200 ease-in"
    ]
  },
  item: ({ props, context }) => ({
    class: [
      // Flex & Alignment
      "inline-flex items-center",
      // State
      {
        "outline-none ring ring-primary-500/50 dark:ring-primary-400/50": context.focused
      },
      // Misc
      {
        "cursor-pointer": !props.readonly,
        "cursor-default": props.readonly
      }
    ]
  }),
  officon: ({ props }) => ({
    class: [
      // Size
      "w-5 h-5",
      // Color
      "text-surface-700 dark:text-surface-0/80",
      // State
      { "hover:text-primary-500 dark:hover:text-primary-400": !props.readonly },
      // Transition
      "transition duration-200 ease-in"
    ]
  }),
  onicon: ({ props }) => ({
    class: [
      // Size
      "w-5 h-5",
      // Color
      "text-primary-500 dark:text-primary-400",
      // State
      { "hover:text-primary-600 dark:hover:text-primary-300": !props.readonly },
      // Transition
      "transition duration-200 ease-in"
    ]
  })
};
const ripple = {
  root: {
    class: ["block absolute bg-surface-0/50 rounded-full pointer-events-none"],
    style: "transform: scale(0)"
  }
};
const scrollpanel = {
  wrapper: {
    class: [
      // Size & Position
      "h-full w-full",
      // Layering
      "z-[1]",
      // Spacing
      "overflow-hidden",
      // Misc
      "relative float-left"
    ]
  },
  content: {
    class: [
      // Size & Spacing
      "h-[calc(100%+18px)] w-[calc(100%+18px)] pr-[18px] pb-[18px] pl-0 pt-0",
      // Overflow & Scrollbar
      "overflow-scroll scrollbar-none",
      // Box Model
      "box-border",
      // Position
      "relative",
      // Webkit Specific
      "[&::-webkit-scrollbar]:hidden"
    ]
  },
  barX: {
    class: [
      // Size & Position
      "h-[9px] bottom-0",
      // Appearance
      "bg-surface-50 dark:bg-surface-700 rounded",
      // Interactivity
      "cursor-pointer",
      // Visibility & Layering
      "invisible z-20",
      // Transition
      "transition duration-[250ms] ease-linear",
      // Misc
      "relative"
    ]
  },
  barY: {
    class: [
      // Size & Position
      "w-[9px] top-0",
      // Appearance
      "bg-surface-50 dark:bg-surface-700 rounded",
      // Interactivity
      "cursor-pointer",
      // Visibility & Layering
      "z-20",
      // Transition
      "transition duration-[250ms] ease-linear",
      // Misc
      "relative"
    ]
  }
};
const scrolltop = {
  root: ({ props }) => ({
    class: [
      // Flex & Alignment
      "flex items-center justify-center",
      // Positioning
      {
        sticky: props.target === "parent",
        fixed: props.target === "window"
      },
      "bottom-[20px] right-[20px]",
      "ml-auto",
      // Shape & Size
      {
        "rounded-md h-8 w-8": props.target === "parent",
        "h-12 w-12 rounded-full shadow-md": props.target === "window"
      },
      // Color
      "text-white dark:text-surface-900",
      {
        "bg-primary-500 dark:bg-primary-400 hover:bg-primary-600 dark:hover:bg-primary-300": props.target === "parent",
        "bg-surface-500 dark:bg-surface-400 hover:bg-surface-600 dark:hover:bg-surface-300": props.target === "window"
      },
      // States
      {
        "hover:bg-primary-600 dark:hover:bg-primary-300": props.target === "parent",
        "hover:bg-surface-600 dark:hover:bg-surface-300": props.target === "window"
      }
    ]
  }),
  transition: {
    enterFromClass: "opacity-0",
    enterActiveClass: "transition-opacity duration-150",
    leaveActiveClass: "transition-opacity duration-150",
    leaveToClass: "opacity-0"
  }
};
const selectbutton = {
  root: ({ props }) => ({
    class: [{ "opacity-60 select-none pointer-events-none cursor-default": props.disabled }]
  }),
  button: ({ context }) => ({
    class: [
      "relative",
      // Font
      "leading-none",
      // Flex Alignment
      "inline-flex items-center align-bottom text-center",
      // Spacing
      "px-4 py-3",
      // Shape
      "border border-r-0",
      "first:rounded-l-md first:rounded-tr-none first:rounded-br-none",
      "last:border-r last:rounded-tl-none last:rounded-bl-none last:rounded-r-md",
      // Color
      {
        "bg-surface-0 dark:bg-surface-900": !context.active,
        "text-surface-700 dark:text-white/80": !context.active,
        "border-surface-200 dark:border-surface-700": !context.active,
        "bg-primary-500 dark:bg-primary-400 border-primary-500 dark:border-primary-400 text-white dark:text-surface-900": context.active
      },
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50 focus:z-10",
      {
        "hover:bg-surface-50 dark:hover:bg-surface-800/80": !context.active,
        "hover:bg-primary-600 dark:hover:bg-primary-300": context.active
      },
      { "opacity-60 select-none pointer-events-none cursor-default": context.disabled },
      // Transition
      "transition duration-200",
      // Misc
      "cursor-pointer select-none overflow-hidden"
    ]
  }),
  label: {
    class: "font-bold"
  }
};
const sidebar = {
  root: ({ props }) => ({
    class: [
      // Flexbox
      "flex flex-col",
      // Position
      "relative",
      { "!transition-none !transform-none !w-screen !h-screen !max-h-full !top-0 !left-0": props.position == "full" },
      // Size
      {
        "h-full w-80": props.position == "left" || props.position == "right",
        "h-auto w-full": props.position == "top" || props.position == "bottom"
      },
      // Shape
      "border-0 dark:border",
      "shadow-lg",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-white/80",
      "dark:border-surface-700",
      // Transitions
      "transition-transform",
      "duration-300",
      // Misc
      "pointer-events-auto"
    ]
  }),
  header: {
    class: [
      // Flexbox and Alignment
      "flex items-center justify-between",
      "shrink-0",
      // Spacing
      "p-5",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-surface-0/80"
    ]
  },
  title: {
    class: ["font-bold text-lg"]
  },
  icons: {
    class: ["flex items-center"]
  },
  closeButton: {
    class: [
      "relative",
      // Flexbox and Alignment
      "flex items-center justify-center",
      // Size and Spacing
      "mr-2",
      "last:mr-0",
      "w-8 h-8",
      // Shape
      "border-0",
      "rounded-full",
      // Colors
      "text-surface-500",
      "bg-transparent",
      // Transitions
      "transition duration-200 ease-in-out",
      // States
      "hover:text-surface-700 dark:hover:text-white/80",
      "hover:bg-surface-100 dark:hover:bg-surface-800/80",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-inset",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "overflow-hidden"
    ]
  },
  closeButtonIcon: {
    class: [
      // Display
      "inline-block",
      // Size
      "w-4",
      "h-4"
    ]
  },
  content: {
    class: [
      // Spacing and Size
      "p-5",
      "pt-0",
      "h-full",
      "w-full",
      // Growth and Overflow
      "grow",
      "overflow-y-auto"
    ]
  },
  mask: ({ props }) => ({
    class: [
      // Transitions
      "transition-all",
      "duration-300",
      { "p-5": !props.position == "full" },
      // Background and Effects
      { "has-[.mask-active]:bg-transparent bg-black/40": props.modal, "has-[.mask-active]:backdrop-blur-none backdrop-blur-sm": props.modal }
    ]
  }),
  transition: ({ props }) => {
    return props.position === "top" ? {
      enterFromClass: "translate-x-0 -translate-y-full translate-z-0 mask-active",
      leaveToClass: "translate-x-0 -translate-y-full translate-z-0 mask-active"
    } : props.position === "bottom" ? {
      enterFromClass: "translate-x-0 translate-y-full translate-z-0 mask-active",
      leaveToClass: "translate-x-0 translate-y-full translate-z-0 mask-active"
    } : props.position === "left" ? {
      enterFromClass: "-translate-x-full translate-y-0 translate-z-0 mask-active",
      leaveToClass: "-translate-x-full translate-y-0 translate-z-0 mask-active"
    } : props.position === "right" ? {
      enterFromClass: "translate-x-full translate-y-0 translate-z-0 mask-active",
      leaveToClass: "translate-x-full translate-y-0 translate-z-0 mask-active"
    } : {
      enterFromClass: "opacity-0 mask-active",
      enterActiveClass: "transition-opacity duration-400 ease-in",
      leaveActiveClass: "transition-opacity duration-400 ease-in",
      leaveToClass: "opacity-0 mask-active"
    };
  }
};
const skeleton = {
  root: ({ props }) => ({
    class: [
      "overflow-hidden",
      {
        "animate-pulse": props.animation !== "none"
      },
      // Round
      { "rounded-full": props.shape === "circle", "rounded-md": props.shape !== "circle" },
      // Colors
      "bg-surface-200 dark:bg-surface-700"
    ]
  })
};
const slider = {
  root: ({ props }) => ({
    class: [
      "relative",
      // Size
      { "h-1 w-60": props.orientation == "horizontal", "w-1 h-56": props.orientation == "vertical" },
      // Shape
      "border-0",
      // Colors
      "bg-surface-100 dark:bg-surface-700",
      // States
      { "opacity-60 select-none pointer-events-none cursor-default": props.disabled }
    ]
  }),
  range: ({ props }) => ({
    class: [
      // Position
      "block absolute",
      {
        "top-0 left-0": props.orientation == "horizontal",
        "bottom-0 left-0": props.orientation == "vertical"
      },
      //Size
      {
        "h-full": props.orientation == "horizontal",
        "w-full": props.orientation == "vertical"
      },
      // Colors
      "bg-primary-500 dark:bg-primary-400"
    ]
  }),
  handle: ({ props }) => ({
    class: [
      "block",
      // Size
      "h-[1.143rem]",
      "w-[1.143rem]",
      {
        "top-[50%] mt-[-0.5715rem] ml-[-0.5715rem]": props.orientation == "horizontal",
        "left-[50%] mb-[-0.5715rem] ml-[-0.5715rem]": props.orientation == "vertical"
      },
      // Shape
      "rounded-full",
      "border-2",
      // Colors
      "bg-surface-0 dark:bg-surface-600",
      "border-primary-500 dark:border-primary-400",
      // States
      "hover:bg-primary-500 hover:border-primary-500",
      "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring",
      "ring-primary-400/50 dark:ring-primary-300/50",
      // Transitions
      "transition duration-200",
      // Misc
      "cursor-grab",
      "touch-action-none"
    ]
  }),
  starthandler: ({ props }) => ({
    class: [
      "block",
      // Size
      "h-[1.143rem]",
      "w-[1.143rem]",
      {
        "top-[50%] mt-[-0.5715rem] ml-[-0.5715rem]": props.orientation == "horizontal",
        "left-[50%] mb-[-0.5715rem] ml-[-0.4715rem]": props.orientation == "vertical"
      },
      // Shape
      "rounded-full",
      "border-2",
      // Colors
      "bg-surface-0 dark:bg-surface-600",
      "border-primary-500 dark:border-primary-400",
      // States
      "hover:bg-primary-500 hover:border-primary-500",
      "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring",
      "focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      // Transitions
      "transition duration-200",
      // Misc
      "cursor-grab",
      "touch-action-none"
    ]
  }),
  endhandler: ({ props }) => ({
    class: [
      "block",
      // Size
      "h-[1.143rem]",
      "w-[1.143rem]",
      {
        "top-[50%] mt-[-0.5715rem] ml-[-0.5715rem]": props.orientation == "horizontal",
        "left-[50%] mb-[-0.5715rem] ml-[-0.4715rem]": props.orientation == "vertical"
      },
      // Shape
      "rounded-full",
      "border-2",
      // Colors
      "bg-surface-0 dark:bg-surface-600",
      "border-primary-500 dark:border-primary-400",
      // States
      "hover:bg-primary-500 hover:border-primary-500",
      "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring",
      "focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      // Transitions
      "transition duration-200",
      // Misc
      "cursor-grab",
      "touch-action-none"
    ]
  })
};
const speeddial = {
  root: {
    class: "absolute flex"
  },
  button: {
    root: ({ props, context }) => ({
      class: [
        "relative",
        "z-20",
        // Alignments
        "items-center inline-flex text-center align-bottom justify-center",
        // Sizes & Spacing
        "leading-[normal]",
        "w-16 h-16 p-0 py-3",
        // Shapes
        "rounded-full",
        "shadow-md",
        // Link Button
        { "text-primary-600 bg-transparent border-transparent": props.link },
        // Plain Button
        { "text-white bg-gray-500 border border-gray-500": props.plain && !props.outlined && !props.text },
        // Plain Text Button
        { "text-surface-500": props.plain && props.text },
        // Plain Outlined Button
        { "text-surface-500 border border-gray-500": props.plain && props.outlined },
        // Text Button
        { "bg-transparent border-transparent": props.text && !props.plain },
        // Outlined Button
        { "bg-transparent border": props.outlined && !props.plain },
        // --- Severity Buttons ---
        // Primary Button
        {
          "text-white dark:text-surface-900": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
          "bg-primary-500 dark:bg-primary-400": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
          "border border-primary-500 dark:border-primary-400": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain
        },
        // Primary Text Button
        { "text-primary-500 dark:text-primary-400": props.text && props.severity === null && !props.plain },
        // Primary Outlined Button
        { "text-primary-500 border border-primary-500 hover:bg-primary-300/20": props.outlined && props.severity === null && !props.plain },
        // Secondary Button
        {
          "text-white dark:text-surface-900": props.severity === "secondary" && !props.text && !props.outlined && !props.plain,
          "bg-surface-500 dark:bg-surface-400": props.severity === "secondary" && !props.text && !props.outlined && !props.plain,
          "border border-surface-500 dark:border-surface-400": props.severity === "secondary" && !props.text && !props.outlined && !props.plain
        },
        // Secondary Text Button
        { "text-surface-500 dark:text-surface-300": props.text && props.severity === "secondary" && !props.plain },
        // Secondary Outlined Button
        { "text-surface-500 dark:text-surface-300 border border-surface-500 hover:bg-surface-300/20": props.outlined && props.severity === "secondary" && !props.plain },
        // Success Button
        {
          "text-white dark:text-green-900": props.severity === "success" && !props.text && !props.outlined && !props.plain,
          "bg-green-500 dark:bg-green-400": props.severity === "success" && !props.text && !props.outlined && !props.plain,
          "border border-green-500 dark:border-green-400": props.severity === "success" && !props.text && !props.outlined && !props.plain
        },
        // Success Text Button
        { "text-green-500 dark:text-green-400": props.text && props.severity === "success" && !props.plain },
        // Success Outlined Button
        { "text-green-500 border border-green-500 hover:bg-green-300/20": props.outlined && props.severity === "success" && !props.plain },
        // Info Button
        {
          "text-white dark:text-surface-900": props.severity === "info" && !props.text && !props.outlined && !props.plain,
          "bg-blue-500 dark:bg-blue-400": props.severity === "info" && !props.text && !props.outlined && !props.plain,
          "border border-blue-500 dark:border-blue-400": props.severity === "info" && !props.text && !props.outlined && !props.plain
        },
        // Info Text Button
        { "text-blue-500 dark:text-blue-400": props.text && props.severity === "info" && !props.plain },
        // Info Outlined Button
        { "text-blue-500 border border-blue-500 hover:bg-blue-300/20 ": props.outlined && props.severity === "info" && !props.plain },
        // Warning Button
        {
          "text-white dark:text-surface-900": props.severity === "warning" && !props.text && !props.outlined && !props.plain,
          "bg-orange-500 dark:bg-orange-400": props.severity === "warning" && !props.text && !props.outlined && !props.plain,
          "border border-orange-500 dark:border-orange-400": props.severity === "warning" && !props.text && !props.outlined && !props.plain
        },
        // Warning Text Button
        { "text-orange-500 dark:text-orange-400": props.text && props.severity === "warning" && !props.plain },
        // Warning Outlined Button
        { "text-orange-500 border border-orange-500 hover:bg-orange-300/20": props.outlined && props.severity === "warning" && !props.plain },
        // Help Button
        {
          "text-white dark:text-surface-900": props.severity === "help" && !props.text && !props.outlined && !props.plain,
          "bg-purple-500 dark:bg-purple-400": props.severity === "help" && !props.text && !props.outlined && !props.plain,
          "border border-purple-500 dark:border-purple-400": props.severity === "help" && !props.text && !props.outlined && !props.plain
        },
        // Help Text Button
        { "text-purple-500 dark:text-purple-400": props.text && props.severity === "help" && !props.plain },
        // Help Outlined Button
        { "text-purple-500 border border-purple-500 hover:bg-purple-300/20": props.outlined && props.severity === "help" && !props.plain },
        // Danger Button
        {
          "text-white dark:text-surface-900": props.severity === "danger" && !props.text && !props.outlined && !props.plain,
          "bg-red-500 dark:bg-red-400": props.severity === "danger" && !props.text && !props.outlined && !props.plain,
          "border border-red-500 dark:border-red-400": props.severity === "danger" && !props.text && !props.outlined && !props.plain
        },
        // Danger Text Button
        { "text-red-500 dark:text-red-400": props.text && props.severity === "danger" && !props.plain },
        // Danger Outlined Button
        { "text-red-500 border border-red-500 hover:bg-red-300/20": props.outlined && props.severity === "danger" && !props.plain },
        // --- Severity Button States ---
        "focus:outline-none focus:outline-offset-0 focus:ring",
        // Link
        { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": props.link },
        // Plain
        { "hover:bg-gray-600 hover:border-gray-600": props.plain && !props.outlined && !props.text },
        // Text & Outlined Button
        { "hover:bg-surface-300/20": props.plain && (props.text || props.outlined) },
        // Primary
        { "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300": !props.link && props.severity === null && !props.text && !props.outlined && !props.plain },
        { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": props.severity === null },
        // Text & Outlined Button
        { "hover:bg-primary-300/20": (props.text || props.outlined) && props.severity === null && !props.plain },
        // Secondary
        { "hover:bg-surface-600 dark:hover:bg-surface-300 hover:border-surface-600 dark:hover:border-surface-300": props.severity === "secondary" && !props.text && !props.outlined && !props.plain },
        { "focus:ring-surface-400/50 dark:focus:ring-surface-300/50": props.severity === "secondary" },
        // Text & Outlined Button
        { "hover:bg-surface-300/20": (props.text || props.outlined) && props.severity === "secondary" && !props.plain },
        // Success
        { "hover:bg-green-600 dark:hover:bg-green-300 hover:border-green-600 dark:hover:border-green-300": props.severity === "success" && !props.text && !props.outlined && !props.plain },
        { "focus:ring-green-400/50 dark:focus:ring-green-300/50": props.severity === "success" },
        // Text & Outlined Button
        { "hover:bg-green-300/20": (props.text || props.outlined) && props.severity === "success" && !props.plain },
        // Info
        { "hover:bg-blue-600 dark:hover:bg-blue-300 hover:border-blue-600 dark:hover:border-blue-300": props.severity === "info" && !props.text && !props.outlined && !props.plain },
        { "focus:ring-blue-400/50 dark:focus:ring-blue-300/50": props.severity === "info" },
        // Text & Outlined Button
        { "hover:bg-blue-300/20": (props.text || props.outlined) && props.severity === "info" && !props.plain },
        // Warning
        { "hover:bg-orange-600 dark:hover:bg-orange-300 hover:border-orange-600 dark:hover:border-orange-300": props.severity === "warning" && !props.text && !props.outlined && !props.plain },
        { "focus:ring-orange-400/50 dark:focus:ring-orange-300/50": props.severity === "warning" },
        // Text & Outlined Button
        { "hover:bg-orange-300/20": (props.text || props.outlined) && props.severity === "warning" && !props.plain },
        // Help
        { "hover:bg-purple-600 dark:hover:bg-purple-300 hover:border-purple-600 dark:hover:border-purple-300": props.severity === "help" && !props.text && !props.outlined && !props.plain },
        { "focus:ring-purple-400/50 dark:focus:ring-purple-300/50": props.severity === "help" },
        // Text & Outlined Button
        { "hover:bg-purple-300/20": (props.text || props.outlined) && props.severity === "help" && !props.plain },
        // Danger
        { "hover:bg-red-600 dark:hover:bg-red-300 hover:border-red-600 dark:hover:border-red-300": props.severity === "danger" && !props.text && !props.outlined && !props.plain },
        { "focus:ring-red-400/50 dark:focus:ring-red-300/50": props.severity === "danger" },
        // Text & Outlined Button
        { "hover:bg-red-300/20": (props.text || props.outlined) && props.severity === "danger" && !props.plain },
        // Disabled
        { "opacity-60 pointer-events-none cursor-default": context.disabled },
        // Transitions
        "transition duration-200 ease-in-out",
        // Misc
        "cursor-pointer overflow-hidden select-none"
      ]
    }),
    label: ({ props }) => ({
      class: [
        "duration-200",
        "font-bold",
        {
          "hover:underline": props.link
        },
        { "flex-1": props.label !== null, "invisible w-0": props.label == null }
      ]
    }),
    icon: ({ props }) => ({
      class: [
        "mx-0",
        {
          "mr-2": props.iconPos == "left" && props.label != null,
          "ml-2 order-1": props.iconPos == "right" && props.label != null,
          "mb-2": props.iconPos == "top" && props.label != null,
          "mt-2": props.iconPos == "bottom" && props.label != null
        }
      ]
    }),
    loadingicon: ({ props }) => ({
      class: [
        "h-4 w-4",
        "mx-0",
        {
          "mr-2": props.iconPos == "left" && props.label != null,
          "ml-2 order-1": props.iconPos == "right" && props.label != null,
          "mb-2": props.iconPos == "top" && props.label != null,
          "mt-2": props.iconPos == "bottom" && props.label != null
        },
        "animate-spin"
      ]
    }),
    badge: ({ props }) => ({
      class: [{ "ml-2 w-4 h-4 leading-none flex items-center justify-center": props.badge }]
    })
  },
  menu: {
    class: [
      // Spacing
      "m-0 p-0",
      // Layout & Flexbox
      "list-none flex items-center justify-center",
      // Transitions
      "transition delay-200",
      // Z-Index (Positioning)
      "z-20"
    ]
  },
  menuitem: ({ props, context }) => ({
    class: [
      "transform transition-transform duration-200 ease-out transition-opacity duration-800",
      // Conditional Appearance
      context.hidden ? "opacity-0 scale-0" : "opacity-1 scale-100",
      // Conditional Spacing
      {
        "my-1 first:mb-2": props.direction == "up" && props.type == "linear",
        "my-1 first:mt-2": props.direction == "down" && props.type == "linear",
        "mx-1 first:mr-2": props.direction == "left" && props.type == "linear",
        "mx-1 first:ml-2": props.direction == "right" && props.type == "linear"
      },
      // Conditional Positioning
      { absolute: props.type !== "linear" }
    ]
  }),
  action: {
    class: [
      // Flexbox & Alignment
      "flex items-center justify-center",
      // Size
      "w-12 h-12",
      // Shape
      "rounded-full relative overflow-hidden",
      // Appearance
      "bg-surface-600 dark:bg-surface-0/80 text-white dark:text-surface-900/80",
      // Hover Effects
      "hover:bg-surface-700 dark:hover:bg-surface-200/80"
    ]
  },
  mask: ({ state }) => ({
    class: [
      // Base Styles
      "absolute left-0 top-0 w-full h-full transition-opacity duration-250 ease-in-out bg-black/40 z-0",
      // Conditional Appearance
      {
        "opacity-0 pointer-events-none": !state.d_visible,
        "opacity-100 transition-opacity duration-400 ease-in-out": state.d_visible
      }
    ]
  })
};
const splitbutton = {
  root: ({ props }) => ({
    class: [
      // Flexbox and Position
      "inline-flex",
      "relative",
      // Shape
      "rounded-md",
      { "shadow-lg": props.raised }
    ]
  }),
  button: {
    root: ({ parent }) => ({
      class: [
        "relative",
        // Alignments
        "items-center inline-flex text-center align-bottom justify-center",
        // Sizes & Spacing
        "leading-[normal]",
        {
          "px-4 py-3": parent.props.size === null,
          "text-sm py-2 px-3": parent.props.size === "small",
          "text-xl py-3 px-4": parent.props.size === "large"
        },
        {
          "min-w-12 p-0 py-3": parent.props.label == null && parent.props.icon !== null
        },
        // Shape
        "rounded-r-none",
        "border-r-0",
        { "rounded-l-full": parent.props.rounded },
        { "rounded-md": !parent.props.rounded, "rounded-full": parent.props.rounded },
        // Link Button
        { "text-primary-600 bg-transparent border-transparent": parent.props.link },
        // Plain Button
        { "text-white bg-gray-500 border border-gray-500": parent.props.plain && !parent.props.outlined && !parent.props.text },
        // Plain Text Button
        { "text-surface-500": parent.props.plain && parent.props.text },
        // Plain Outlined Button
        { "text-surface-500 border border-gray-500": parent.props.plain && parent.props.outlined },
        // Text Button
        { "bg-transparent border-transparent": parent.props.text && !parent.props.plain },
        // Outlined Button
        { "bg-transparent border": parent.props.outlined && !parent.props.plain },
        // --- Severity Buttons ---
        // Primary Button
        {
          "text-white dark:text-surface-900": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-primary-500 dark:bg-primary-400": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-primary-500 dark:border-primary-400": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Primary Text Button
        { "text-primary-500 dark:text-primary-400": parent.props.text && parent.props.severity === null && !parent.props.plain },
        // Primary Outlined Button
        { "text-primary-500 border border-primary-500 hover:bg-primary-300/20": parent.props.outlined && parent.props.severity === null && !parent.props.plain },
        // Secondary Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-surface-500 dark:bg-surface-400": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-surface-500 dark:border-surface-400": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Secondary Text Button
        { "text-surface-500 dark:text-surface-400": parent.props.text && parent.props.severity === "secondary" && !parent.props.plain },
        // Secondary Outlined Button
        { "text-surface-500 border border-surface-500 hover:bg-surface-300/20": parent.props.outlined && parent.props.severity === "secondary" && !parent.props.plain },
        // Success Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-green-500 dark:bg-green-400": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-green-500 dark:border-green-400": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Success Text Button
        { "text-surface-500 dark:text-surface-400": parent.props.text && parent.props.severity === "secondary" && !parent.props.plain },
        // Success Outlined Button
        { "text-green-500 border border-green-500 hover:bg-green-300/20": parent.props.outlined && parent.props.severity === "success" && !parent.props.plain },
        // Info Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-blue-500 dark:bg-blue-400": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-blue-500 dark:border-blue-400": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Info Text Button
        { "text-blue-500 dark:text-blue-400": parent.props.text && parent.props.severity === "info" && !parent.props.plain },
        // Info Outlined Button
        { "text-blue-500 border border-blue-500 hover:bg-blue-300/20 ": parent.props.outlined && parent.props.severity === "info" && !parent.props.plain },
        // Warning Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-orange-500 dark:bg-orange-400": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-orange-500 dark:border-orange-400": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Warning Text Button
        { "text-orange-500 dark:text-orange-400": parent.props.text && parent.props.severity === "warning" && !parent.props.plain },
        // Warning Outlined Button
        { "text-orange-500 border border-orange-500 hover:bg-orange-300/20": parent.props.outlined && parent.props.severity === "warning" && !parent.props.plain },
        // Help Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-purple-500 dark:bg-purple-400": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-purple-500 dark:border-purple-400": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Help Text Button
        { "text-purple-500 dark:text-purple-400": parent.props.text && parent.props.severity === "help" && !parent.props.plain },
        // Help Outlined Button
        { "text-purple-500 border border-purple-500 hover:bg-purple-300/20": parent.props.outlined && parent.props.severity === "help" && !parent.props.plain },
        // Danger Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-red-500 dark:bg-red-400": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-red-500 dark:border-red-400": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Danger Text Button
        { "text-red-500 dark:text-red-400": parent.props.text && parent.props.severity === "danger" && !parent.props.plain },
        // Danger Outlined Button
        { "text-red-500 border border-red-500 hover:bg-red-300/20": parent.props.outlined && parent.props.severity === "danger" && !parent.props.plain },
        // --- Severity Button States ---
        "focus:outline-none focus:outline-offset-0 focus:ring",
        // Link
        { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": parent.props.link },
        // Plain
        { "hover:bg-gray-600 hover:border-gray-600": parent.props.plain && !parent.props.outlined && !parent.props.text },
        // Text & Outlined Button
        { "hover:bg-surface-300/20": parent.props.plain && (parent.props.text || parent.props.outlined) },
        // Primary
        { "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        // Text & Outlined Button
        { "hover:bg-primary-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === null && !parent.props.plain },
        // Secondary
        { "hover:bg-surface-600 dark:hover:bg-surface-300 hover:border-surface-600 dark:hover:border-surface-300": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-surface-400/50 dark:focus:ring-surface-300/50": parent.props.severity === "secondary" },
        // Text & Outlined Button
        { "hover:bg-surface-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "secondary" && !parent.props.plain },
        // Success
        { "hover:bg-green-600 dark:hover:bg-green-300 hover:border-green-600 dark:hover:border-green-300": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-green-400/50 dark:focus:ring-green-300/50": parent.props.severity === "success" },
        // Text & Outlined Button
        { "hover:bg-green-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "success" && !parent.props.plain },
        // Info
        { "hover:bg-blue-600 dark:hover:bg-blue-300 hover:border-blue-600 dark:hover:border-blue-300": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-blue-400/50 dark:focus:ring-blue-300/50": parent.props.severity === "info" },
        // Text & Outlined Button
        { "hover:bg-blue-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "info" && !parent.props.plain },
        // Warning
        { "hover:bg-orange-600 dark:hover:bg-orange-300 hover:border-orange-600 dark:hover:border-orange-300": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-orange-400/50 dark:focus:ring-orange-300/50": parent.props.severity === "warning" },
        // Text & Outlined Button
        { "hover:bg-orange-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "warning" && !parent.props.plain },
        // Help
        { "hover:bg-purple-600 dark:hover:bg-purple-300 hover:border-purple-600 dark:hover:border-purple-300": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-purple-400/50 dark:focus:ring-purple-300/50": parent.props.severity === "help" },
        // Text & Outlined Button
        { "hover:bg-purple-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "help" && !parent.props.plain },
        // Warning
        { "hover:bg-red-600 dark:hover:bg-red-300 hover:border-red-600 dark:hover:border-red-300": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-red-400/50 dark:focus:ring-red-300/50": parent.props.severity === "danger" },
        // Text & Outlined Button
        { "hover:bg-red-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "danger" && !parent.props.plain },
        // Transitions
        "transition duration-200 ease-in-out",
        // Misc
        "cursor-pointer overflow-hidden select-none"
      ]
    }),
    icon: {
      class: [
        // Margins
        "mr-2"
      ]
    }
  },
  menubutton: {
    root: ({ parent }) => ({
      class: [
        "relative",
        // Alignments
        "items-center inline-flex text-center align-bottom justify-center",
        // Sizes & Spacing
        "leading-[normal]",
        {
          "px-4 py-3": parent.props.size === null,
          "text-sm py-2 px-3": parent.props.size === "small",
          "text-xl py-3 px-4": parent.props.size === "large"
        },
        {
          "min-w-12 p-0 py-3": parent.props.label == null && parent.props.icon !== null
        },
        // Shape
        "rounded-l-none",
        { "rounded-l-full": parent.props.rounded },
        { "rounded-md": !parent.props.rounded, "rounded-full": parent.props.rounded },
        // Link Button
        { "text-primary-600 bg-transparent border-transparent": parent.props.link },
        // Plain Button
        { "text-white bg-gray-500 border border-gray-500": parent.props.plain && !parent.props.outlined && !parent.props.text },
        // Plain Text Button
        { "text-surface-500": parent.props.plain && parent.props.text },
        // Plain Outlined Button
        { "text-surface-500 border border-gray-500": parent.props.plain && parent.props.outlined },
        // Text Button
        { "bg-transparent border-transparent": parent.props.text && !parent.props.plain },
        // Outlined Button
        { "bg-transparent border": parent.props.outlined && !parent.props.plain },
        // --- Severity Buttons ---
        // Primary Button
        {
          "text-white dark:text-surface-900": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-primary-500 dark:bg-primary-400": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-primary-500 dark:border-primary-400": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Primary Text Button
        { "text-primary-500 dark:text-primary-400": parent.props.text && parent.props.severity === null && !parent.props.plain },
        // Primary Outlined Button
        { "text-primary-500 border border-primary-500 hover:bg-primary-300/20": parent.props.outlined && parent.props.severity === null && !parent.props.plain },
        // Secondary Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-surface-500 dark:bg-surface-400": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-surface-500 dark:border-surface-400": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Secondary Text Button
        { "text-surface-500 dark:text-surface-400": parent.props.text && parent.props.severity === "secondary" && !parent.props.plain },
        // Secondary Outlined Button
        { "text-surface-500 border border-surface-500 hover:bg-surface-300/20": parent.props.outlined && parent.props.severity === "secondary" && !parent.props.plain },
        // Success Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-green-500 dark:bg-green-400": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-green-500 dark:border-green-400": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Success Text Button
        { "text-surface-500 dark:text-surface-400": parent.props.text && parent.props.severity === "secondary" && !parent.props.plain },
        // Success Outlined Button
        { "text-green-500 border border-green-500 hover:bg-green-300/20": parent.props.outlined && parent.props.severity === "success" && !parent.props.plain },
        // Info Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-blue-500 dark:bg-blue-400": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-blue-500 dark:border-blue-400": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Info Text Button
        { "text-blue-500 dark:text-blue-400": parent.props.text && parent.props.severity === "info" && !parent.props.plain },
        // Info Outlined Button
        { "text-blue-500 border border-blue-500 hover:bg-blue-300/20 ": parent.props.outlined && parent.props.severity === "info" && !parent.props.plain },
        // Warning Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-orange-500 dark:bg-orange-400": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-orange-500 dark:border-orange-400": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Warning Text Button
        { "text-orange-500 dark:text-orange-400": parent.props.text && parent.props.severity === "warning" && !parent.props.plain },
        // Warning Outlined Button
        { "text-orange-500 border border-orange-500 hover:bg-orange-300/20": parent.props.outlined && parent.props.severity === "warning" && !parent.props.plain },
        // Help Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-purple-500 dark:bg-purple-400": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-purple-500 dark:border-purple-400": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Help Text Button
        { "text-purple-500 dark:text-purple-400": parent.props.text && parent.props.severity === "help" && !parent.props.plain },
        // Help Outlined Button
        { "text-purple-500 border border-purple-500 hover:bg-purple-300/20": parent.props.outlined && parent.props.severity === "help" && !parent.props.plain },
        // Danger Button
        {
          "text-white dark:text-surface-900": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "bg-red-500 dark:bg-red-400": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain,
          "border border-red-500 dark:border-red-400": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain
        },
        // Danger Text Button
        { "text-red-500 dark:text-red-400": parent.props.text && parent.props.severity === "danger" && !parent.props.plain },
        // Danger Outlined Button
        { "text-red-500 border border-red-500 hover:bg-red-300/20": parent.props.outlined && parent.props.severity === "danger" && !parent.props.plain },
        // --- Severity Button States ---
        "focus:outline-none focus:outline-offset-0 focus:ring",
        // Link
        { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": parent.props.link },
        // Plain
        { "hover:bg-gray-600 hover:border-gray-600": parent.props.plain && !parent.props.outlined && !parent.props.text },
        // Text & Outlined Button
        { "hover:bg-surface-300/20": parent.props.plain && (parent.props.text || parent.props.outlined) },
        // Primary
        { "hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-primary-400/50 dark:focus:ring-primary-300/50": !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        // Text & Outlined Button
        { "hover:bg-primary-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === null && !parent.props.plain },
        // Secondary
        { "hover:bg-surface-600 dark:hover:bg-surface-300 hover:border-surface-600 dark:hover:border-surface-300": parent.props.severity === "secondary" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-surface-400/50 dark:focus:ring-surface-300/50": parent.props.severity === "secondary" },
        // Text & Outlined Button
        { "hover:bg-surface-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "secondary" && !parent.props.plain },
        // Success
        { "hover:bg-green-600 dark:hover:bg-green-300 hover:border-green-600 dark:hover:border-green-300": parent.props.severity === "success" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-green-400/50 dark:focus:ring-green-300/50": parent.props.severity === "success" },
        // Text & Outlined Button
        { "hover:bg-green-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "success" && !parent.props.plain },
        // Info
        { "hover:bg-blue-600 dark:hover:bg-blue-300 hover:border-blue-600 dark:hover:border-blue-300": parent.props.severity === "info" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-blue-400/50 dark:focus:ring-blue-300/50": parent.props.severity === "info" },
        // Text & Outlined Button
        { "hover:bg-blue-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "info" && !parent.props.plain },
        // Warning
        { "hover:bg-orange-600 dark:hover:bg-orange-300 hover:border-orange-600 dark:hover:border-orange-300": parent.props.severity === "warning" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-orange-400/50 dark:focus:ring-orange-300/50": parent.props.severity === "warning" },
        // Text & Outlined Button
        { "hover:bg-orange-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "warning" && !parent.props.plain },
        // Help
        { "hover:bg-purple-600 dark:hover:bg-purple-300 hover:border-purple-600 dark:hover:border-purple-300": parent.props.severity === "help" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-purple-400/50 dark:focus:ring-purple-300/50": parent.props.severity === "help" },
        // Text & Outlined Button
        { "hover:bg-purple-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "help" && !parent.props.plain },
        // Warning
        { "hover:bg-red-600 dark:hover:bg-red-300 hover:border-red-600 dark:hover:border-red-300": parent.props.severity === "danger" && !parent.props.text && !parent.props.outlined && !parent.props.plain },
        { "focus:ring-red-400/50 dark:focus:ring-red-300/50": parent.props.severity === "danger" },
        // Text & Outlined Button
        { "hover:bg-red-300/20": (parent.props.text || parent.props.outlined) && parent.props.severity === "danger" && !parent.props.plain },
        // Transitions
        "transition duration-200 ease-in-out",
        // Misc
        "cursor-pointer overflow-hidden select-none"
      ]
    }),
    label: {
      class: ["hidden"]
    }
  },
  menu: {
    root: {
      class: [
        // Shape
        "rounded-md",
        // Size
        "min-w-[12rem]",
        "py-1",
        // Colors
        "bg-surface-0 dark:bg-surface-700",
        "border border-surface-200 dark:border-surface-700"
      ]
    },
    menu: {
      class: [
        // Spacings and Shape
        "list-none",
        "m-0",
        "p-0",
        "outline-none"
      ]
    },
    menuitem: {
      class: [
        // Position
        "relative"
      ]
    },
    content: ({ context }) => ({
      class: [
        //Shape
        "rounded-none",
        //  Colors
        {
          "text-surface-500 dark:text-white/70": !context.focused && !context.active,
          "text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-surface-600/90": context.focused && !context.active,
          "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": context.focused && context.active,
          "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": !context.focused && context.active
        },
        // Hover States
        {
          "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.active,
          "hover:bg-primary-500/50 dark:hover:bg-primary-300/30 text-primary-700 dark:text-surface-0/80": context.active
        },
        // Transitions
        "transition-shadow",
        "duration-200"
      ]
    }),
    action: {
      class: [
        "relative",
        // Flexbox
        "flex",
        "items-center",
        // Spacing
        "py-3",
        "px-5",
        // Color
        "text-surface-700 dark:text-white/80",
        // Misc
        "no-underline",
        "overflow-hidden",
        "cursor-pointer",
        "select-none"
      ]
    },
    icon: {
      class: [
        // Spacing
        "mr-2",
        // Color
        "text-surface-600 dark:text-white/70"
      ]
    },
    label: {
      class: ["leading-none"]
    },
    submenuicon: {
      class: [
        // Position
        "ml-auto"
      ]
    },
    submenu: {
      class: [
        // Size
        "w-full sm:w-48",
        // Spacing
        "py-1",
        "m-0",
        "list-none",
        // Shape
        "shadow-none sm:shadow-md",
        "border-0",
        // Position
        "static sm:absolute",
        "z-10",
        // Color
        "bg-surface-0 dark:bg-surface-700"
      ]
    },
    separator: {
      class: "border-t border-surface-200 dark:border-surface-600 my-1"
    }
  }
};
const steps = {
  root: {
    class: "relative"
  },
  menu: {
    class: "p-0 m-0 list-none flex"
  },
  menuitem: {
    class: [
      // Flexbox and Position
      "relative",
      "flex",
      "justify-center",
      "flex-1",
      "overflow-hidden",
      // Before
      "before:border-t",
      "before:border-surface-200",
      "before:dark:border-surface-700",
      "before:w-full",
      "before:absolute",
      "before:top-1/2",
      "before:left-0",
      "before:transform",
      "before:-mt-4"
    ]
  },
  action: ({ props }) => ({
    class: [
      // Flexbox
      "inline-flex items-center",
      "flex-col",
      // Transitions and Shape
      "transition-shadow",
      "rounded-md",
      // Colors
      "bg-surface-0",
      "dark:bg-transparent",
      // States
      "focus:outline-none focus:outline-offset-0 focus:ring",
      "focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Misc
      "overflow-hidden",
      { "cursor-pointer": !props.readonly }
    ]
  }),
  step: ({ context, props }) => ({
    class: [
      // Flexbox
      "flex items-center justify-center",
      // Position
      "z-20",
      // Shape
      "rounded-full",
      "border",
      // Size
      "w-[2rem]",
      "h-[2rem]",
      "text-sm",
      "leading-[2rem]",
      // Colors
      {
        "text-surface-400 dark:text-white/60": !context.active,
        "border-surface-100 dark:border-surface-700": !context.active,
        "bg-surface-0 dark:bg-surface-800": !context.active,
        "bg-primary-500 dark:bg-primary-400": context.active,
        "border-primary-500 dark:border-primary-400": context.active,
        "text-surface-0 dark:text-surface-900": context.active
      },
      // States
      {
        "hover:border-surface-300 dark:hover:border-surface-500": !context.active && !props.readonly
      },
      // Transition
      "transition-colors duration-200 ease-in-out"
    ]
  }),
  label: ({ context }) => ({
    class: [
      // Font
      "leading-5",
      { "font-bold": context.active },
      // Display
      "block",
      // Spacing
      "mt-2",
      // Colors
      { "text-surface-400 dark:text-white/60": !context.active, "text-surface-800 dark:text-white/80": context.active },
      // Text and Overflow
      "whitespace-nowrap",
      "overflow-hidden",
      "overflow-ellipsis",
      "max-w-full"
    ]
  })
};
const tabmenu = {
  root: {
    class: "overflow-x-auto"
  },
  menu: {
    class: [
      // Flexbox
      "flex flex-1",
      // Spacing
      "list-none",
      "p-0 m-0",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "border-b-2 border-surface-200 dark:border-surface-700",
      "text-surface-900 dark:text-surface-0/80"
    ]
  },
  menuitem: {
    class: "mr-0"
  },
  action: ({ context, state }) => ({
    class: [
      "relative",
      // Font
      "font-bold",
      // Flexbox and Alignment
      "flex items-center",
      // Spacing
      "p-5",
      "-mb-[2px]",
      // Shape
      "border-b-2",
      "rounded-t-md",
      // Colors and Conditions
      {
        "border-surface-200 dark:border-surface-700": state.d_activeIndex !== context.index,
        "bg-surface-0 dark:bg-surface-800": state.d_activeIndex !== context.index,
        "text-surface-700 dark:text-surface-0/80": state.d_activeIndex !== context.index,
        "bg-surface-0 dark:bg-surface-800": state.d_activeIndex === context.index,
        "border-primary-500 dark:border-primary-400": state.d_activeIndex === context.index,
        "text-primary-500 dark:text-primary-400": state.d_activeIndex === context.index
      },
      // States
      "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset",
      "focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      {
        "hover:bg-surface-0 dark:hover:bg-surface-800/80": state.d_activeIndex !== context.index,
        "hover:border-surface-400 dark:hover:border-primary-400": state.d_activeIndex !== context.index,
        "hover:text-surface-900 dark:hover:text-surface-0": state.d_activeIndex !== context.index
      },
      // Transitions
      "transition-all duration-200",
      // Misc
      "cursor-pointer select-none text-decoration-none",
      "overflow-hidden",
      "user-select-none"
    ]
  }),
  icon: {
    class: "mr-2"
  }
};
const tabview = {
  navContainer: ({ props }) => ({
    class: [
      // Position
      "relative",
      // Misc
      { "overflow-hidden": props.scrollable }
    ]
  }),
  navContent: {
    class: [
      // Overflow and Scrolling
      "overflow-y-hidden overscroll-contain",
      "overscroll-auto",
      "scroll-smooth",
      "[&::-webkit-scrollbar]:hidden"
    ]
  },
  previousButton: {
    class: [
      // Flexbox and Alignment
      "flex items-center justify-center",
      // Position
      "!absolute",
      "top-0 left-0",
      "z-20",
      // Size and Shape
      "h-full w-12",
      "rounded-none",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-primary-500 dark:text-primary-400",
      "shadow-md"
    ]
  },
  nextButton: {
    class: [
      // Flexbox and Alignment
      "flex items-center justify-center",
      // Position
      "!absolute",
      "top-0 right-0",
      "z-20",
      // Size and Shape
      "h-full w-12",
      "rounded-none",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "text-primary-500 dark:text-primary-400",
      "shadow-md"
    ]
  },
  nav: {
    class: [
      // Flexbox
      "flex flex-1",
      // Spacing
      "list-none",
      "p-0 m-0",
      // Colors
      "bg-surface-0 dark:bg-surface-800",
      "border-b-2 border-surface-200 dark:border-surface-700",
      "text-surface-900 dark:text-surface-0/80"
    ]
  },
  tabpanel: {
    header: ({ props }) => ({
      class: [
        // Spacing
        "mr-0",
        // Misc
        {
          "opacity-60 cursor-default user-select-none select-none pointer-events-none": props == null ? void 0 : props.disabled
        }
      ]
    }),
    headerAction: ({ parent, context }) => ({
      class: [
        "relative",
        // Font
        "font-bold",
        // Flexbox and Alignment
        "flex items-center",
        // Spacing
        "p-5",
        "-mb-[2px]",
        // Shape
        "border-b-2",
        "rounded-t-md",
        // Colors and Conditions
        {
          "border-surface-200 dark:border-surface-700": parent.state.d_activeIndex !== context.index,
          "bg-surface-0 dark:bg-surface-800": parent.state.d_activeIndex !== context.index,
          "text-surface-700 dark:text-surface-0/80": parent.state.d_activeIndex !== context.index,
          "bg-surface-0 dark:bg-surface-800": parent.state.d_activeIndex === context.index,
          "border-primary-500 dark:border-primary-400": parent.state.d_activeIndex === context.index,
          "text-primary-500 dark:text-primary-400": parent.state.d_activeIndex === context.index
        },
        // States
        "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset",
        "focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
        {
          "hover:bg-surface-0 dark:hover:bg-surface-800/80": parent.state.d_activeIndex !== context.index,
          "hover:border-surface-400 dark:hover:border-primary-400": parent.state.d_activeIndex !== context.index,
          "hover:text-surface-900 dark:hover:text-surface-0": parent.state.d_activeIndex !== context.index
        },
        // Transitions
        "transition-all duration-200",
        // Misc
        "cursor-pointer select-none text-decoration-none",
        "overflow-hidden",
        "user-select-none"
      ]
    }),
    headerTitle: {
      class: [
        // Text
        "leading-none",
        "whitespace-nowrap"
      ]
    },
    content: {
      class: [
        // Spacing
        "p-5",
        // Shape
        "rounded-b-md",
        // Colors
        "bg-surface-0 dark:bg-surface-800",
        "text-surface-700 dark:text-surface-0/80",
        "border-0"
      ]
    }
  }
};
const tag = {
  root: ({ props }) => ({
    class: [
      //Font
      "text-xs font-bold",
      //Alignments
      "inline-flex items-center justify-center",
      //Spacing
      "px-2 py-1",
      //Shape
      {
        "rounded-md": !props.rounded,
        "rounded-full": props.rounded
      },
      //Colors
      "text-white dark:text-surface-900",
      {
        "bg-primary-500 dark:bg-primary-400": props.severity == null || props.severity == "primary",
        "bg-green-500 dark:bg-green-400": props.severity == "success",
        "bg-blue-500 dark:bg-blue-400": props.severity == "info",
        "bg-orange-500 dark:bg-orange-400": props.severity == "warning",
        "bg-red-500 dark:bg-red-400": props.severity == "danger"
      }
    ]
  }),
  value: {
    class: "leading-normal"
  },
  icon: {
    class: "mr-1 text-sm"
  }
};
const terminal = {
  root: {
    class: [
      // Spacing
      "p-5",
      // Shape
      "rounded-md",
      // Color
      "bg-surface-900 text-white",
      "border border-surface-700",
      // Sizing & Overflow
      "h-72 overflow-auto"
    ]
  },
  container: {
    class: [
      // Flexbox
      "flex items-center"
    ]
  },
  prompt: {
    class: [
      // Color
      "text-surface-400"
    ]
  },
  response: {
    class: [
      // Color
      "text-primary-400"
    ]
  },
  command: {
    class: [
      // Color
      "text-primary-400"
    ]
  },
  commandtext: {
    class: [
      // Flexbox
      "flex-1 shrink grow-0",
      // Shape
      "border-0",
      // Spacing
      "p-0",
      // Color
      "bg-transparent text-inherit",
      // Outline
      "outline-none"
    ]
  }
};
const textarea = {
  root: ({ context }) => ({
    class: [
      // Font
      "font-sans leading-none",
      // Spacing
      "m-0",
      "p-3",
      // Shape
      "rounded-md",
      // Colors
      "text-surface-600 dark:text-surface-200",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-600",
      // States
      {
        "hover:border-primary-500 dark:hover:border-primary-400": !context.disabled,
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50": !context.disabled,
        "opacity-60 select-none pointer-events-none cursor-default": context.disabled
      },
      // Misc
      "appearance-none",
      "transition-colors duration-200"
    ]
  })
};
const tieredmenu = {
  root: {
    class: [
      // Shape
      "rounded-md",
      // Size
      "min-w-[12rem]",
      "py-1",
      // Colors
      "bg-surface-0 dark:bg-surface-700",
      "border border-surface-200 dark:border-surface-700"
    ]
  },
  menu: {
    class: [
      // Spacings and Shape
      "list-none",
      "m-0",
      "p-0",
      "outline-none"
    ]
  },
  menuitem: {
    class: [
      // Position
      "relative"
    ]
  },
  content: ({ context }) => ({
    class: [
      //Shape
      "rounded-none",
      //  Colors
      {
        "text-surface-500 dark:text-white/70": !context.focused && !context.active,
        "text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-surface-600/90": context.focused && !context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": context.focused && context.active,
        "text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30": !context.focused && context.active
      },
      // Hover States
      {
        "hover:bg-surface-100 dark:hover:bg-surface-600/80": !context.active,
        "hover:bg-primary-500/50 dark:hover:bg-primary-300/30 text-primary-700 dark:text-surface-0/80": context.active
      },
      // Transitions
      "transition-shadow",
      "duration-200"
    ]
  }),
  action: {
    class: [
      "relative",
      // Flexbox
      "flex",
      "items-center",
      // Spacing
      "py-3",
      "px-5",
      // Color
      "text-surface-700 dark:text-white/80",
      // Misc
      "no-underline",
      "overflow-hidden",
      "cursor-pointer",
      "select-none"
    ]
  },
  icon: {
    class: [
      // Spacing
      "mr-2",
      // Color
      "text-surface-600 dark:text-white/70"
    ]
  },
  label: {
    class: ["leading-none"]
  },
  submenuicon: {
    class: [
      // Position
      "ml-auto"
    ]
  },
  submenu: {
    class: [
      // Size
      "w-full sm:w-48",
      // Spacing
      "py-1",
      "m-0",
      "list-none",
      // Shape
      "shadow-none sm:shadow-md",
      "border-0",
      // Position
      "static sm:absolute",
      "z-10",
      // Color
      "bg-surface-0 dark:bg-surface-700"
    ]
  },
  separator: {
    class: "border-t border-surface-200 dark:border-surface-600 my-1"
  }
};
const timeline = {
  root: ({ props }) => ({
    class: [
      "flex grow",
      {
        "flex-col": props.layout === "vertical",
        "flex-row flex-1": props.layout === "horizontal"
      }
    ]
  }),
  event: ({ props, context }) => ({
    class: [
      "flex relative min-h-[70px]",
      {
        "flex-row-reverse": props.align === "right" || props.layout === "vertical" && props.align === "alternate" && context.index % 2 === 1,
        "flex-col flex-1": props.layout === "horizontal",
        "flex-col-reverse ": props.align === "bottom" || props.layout === "horizontal" && props.align === "alternate" && context.index % 2 === 1
      }
    ]
  }),
  opposite: ({ props, context }) => ({
    class: [
      "flex-1",
      {
        "px-4": props.layout === "vertical",
        "py-4": props.layout === "horizontal"
      },
      {
        "text-right": props.align === "left" || props.layout === "vertical" && props.align === "alternate" && context.index % 2 === 0,
        "text-left": props.align === "right" || props.layout === "vertical" && props.align === "alternate" && context.index % 2 === 1
      }
    ]
  }),
  separator: ({ props }) => ({
    class: [
      "flex items-center flex-initial",
      {
        "flex-col": props.layout === "vertical",
        "flex-row": props.layout === "horizontal"
      }
    ]
  }),
  marker: {
    class: [
      // Display & Flexbox
      "flex self-baseline",
      // Size
      "w-4 h-4",
      // Appearance
      "rounded-full border-2 border-primary-500 bg-surface-0 dark:border-primary-300 dark:bg-surface-900/40"
    ]
  },
  connector: ({ props }) => ({
    class: [
      "grow bg-surface-300 dark:bg-surface-700",
      {
        "w-[2px]": props.layout === "vertical",
        "w-full h-[2px]": props.layout === "horizontal"
      }
    ]
  }),
  content: ({ props, context }) => ({
    class: [
      "flex-1",
      {
        "px-4": props.layout === "vertical",
        "py-4": props.layout === "horizontal"
      },
      {
        "text-left": props.align === "left" || props.layout === "vertical" && props.align === "alternate" && context.index % 2 === 0,
        "text-right": props.align === "right" || props.layout === "vertical" && props.align === "alternate" && context.index % 2 === 1
      },
      {
        "min-h-0": props.layout === "vertical" && context.index === context.count,
        "grow-0": props.layout === "horizontal" && context.index === context.count
      }
    ]
  })
};
const toast = {
  root: ({ props }) => ({
    class: [
      //Size and Shape
      "w-96 rounded-md",
      // Positioning
      { "-translate-x-2/4": props.position == "top-center" || props.position == "bottom-center" }
    ]
  }),
  container: ({ props }) => ({
    class: [
      "my-4 rounded-md w-full",
      "border-solid border-0 border-l-[6px]",
      "backdrop-blur-[10px] shadow-md",
      // Colors
      {
        "bg-blue-100/70 dark:bg-blue-500/20": props.message.severity == "info",
        "bg-green-100/70 dark:bg-green-500/20": props.message.severity == "success",
        "bg-orange-100/70 dark:bg-orange-500/20": props.message.severity == "warn",
        "bg-red-100/70 dark:bg-red-500/20": props.message.severity == "error"
      },
      {
        "border-blue-500 dark:border-blue-400": props.message.severity == "info",
        "border-green-500 dark:border-green-400": props.message.severity == "success",
        "border-orange-500 dark:border-orange-400": props.message.severity == "warn",
        "border-red-500 dark:border-red-400": props.message.severity == "error"
      },
      {
        "text-blue-700 dark:text-blue-300": props.message.severity == "info",
        "text-green-700 dark:text-green-300": props.message.severity == "success",
        "text-orange-700 dark:text-orange-300": props.message.severity == "warn",
        "text-red-700 dark:text-red-300": props.message.severity == "error"
      }
    ]
  }),
  content: {
    class: "flex items-start p-4"
  },
  icon: {
    class: [
      // Sizing and Spacing
      "w-6 h-6",
      "text-lg leading-none mr-2 shrink-0"
    ]
  },
  text: {
    class: [
      // Font and Text
      "text-base leading-none",
      "ml-2",
      "flex-1"
    ]
  },
  summary: {
    class: "font-bold block"
  },
  detail: {
    class: "mt-2 block"
  },
  closebutton: {
    class: [
      // Flexbox
      "flex items-center justify-center",
      // Size
      "w-8 h-8",
      // Spacing and Misc
      "ml-auto  relative",
      // Shape
      "rounded-full",
      // Colors
      "bg-transparent",
      // Transitions
      "transition duration-200 ease-in-out",
      // States
      "hover:bg-surface-0/50 dark:hover:bg-surface-0/10",
      // Misc
      "overflow-hidden"
    ]
  },
  transition: {
    enterFromClass: "opacity-0 translate-y-2/4",
    enterActiveClass: "transition-[transform,opacity] duration-300",
    leaveFromClass: "max-h-[1000px]",
    leaveActiveClass: "!transition-[max-height_.45s_cubic-bezier(0,1,0,1),opacity_.3s,margin-bottom_.3s] overflow-hidden",
    leaveToClass: "max-h-0 opacity-0 mb-0"
  }
};
const togglebutton = {
  root: {
    class: [
      "relative",
      // Alignment
      "inline-flex",
      "align-bottom",
      // Misc
      "cursor-pointer",
      "select-none"
    ]
  },
  box: ({ props }) => ({
    class: [
      // Alignments
      "items-center inline-flex flex-1 text-center align-bottom justify-center",
      // Sizes & Spacing
      "px-4 py-3 leading-none",
      // Shapes
      "rounded-md border",
      // Colors
      {
        "bg-surface-0 dark:bg-surface-900 ": !props.modelValue,
        "border-surface-200 dark:border-surface-700 ": !props.modelValue,
        "text-surface-700 dark:text-white/80": !props.modelValue,
        "bg-primary-500 dark:bg-primary-400 border-primary-500 dark:border-primary-400 text-white dark:text-surface-900": props.modelValue
      },
      // States
      {
        "peer-hover:bg-surface-50 dark:peer-hover:bg-surface-800/80 peer-hover:border-surface-200 dark:peer-hover:bg-surface-700 peer-hover:text-surface-700 dark:peer-hover:text-white/80": !props.modelValue,
        "peer-hover:bg-primary-600 peer-hover:border-primary-600 dark:peer-hover:bg-primary-300 dark:peer-hover:border-primary-300": props.modelValue,
        "peer-focus-visible:ring peer-focus-visible:ring-primary-400/50 dark:peer-focus-visible:ring-primary-300/50": !props.disabled
      },
      // Transitions
      "transition-all duration-200",
      // Misc
      { "cursor-pointer": !props.disabled, "opacity-60 select-none pointer-events-none cursor-default": props.disabled }
    ]
  }),
  label: {
    class: "font-bold text-center w-full"
  },
  input: {
    class: [
      "peer",
      // Size
      "w-full ",
      "h-full",
      // Position
      "absolute",
      "top-0 left-0",
      "z-10",
      // Spacing
      "p-0",
      "m-0",
      // Shape
      "opacity-0",
      "rounded-md",
      "outline-none",
      "border border-surface-200 dark:border-surface-700",
      // Misc
      "appareance-none",
      "cursor-pointer"
    ]
  },
  icon: ({ props }) => ({
    class: [
      " mr-2",
      {
        "text-surface-600 dark:text-white/70": !props.modelValue,
        "text-white dark:text-surface-900": props.modelValue
      }
    ]
  })
};
const toolbar = {
  root: {
    class: [
      // Flex & Alignment
      "flex items-center justify-between flex-wrap",
      "gap-2",
      // Spacing
      "p-5",
      // Shape
      "rounded-md",
      // Color
      "bg-surface-50 dark:bg-surface-800",
      "border border-surface-200 dark:border-surface-700"
    ]
  },
  start: {
    class: "flex items-center"
  },
  center: {
    class: "flex items-center"
  },
  end: {
    class: "flex items-center"
  }
};
const tooltip = {
  root: ({ context, props }) => ({
    class: [
      // Position and Shadows
      "absolute",
      "shadow-md",
      "p-fadein",
      // Spacing
      {
        "py-0 px-1": (context == null ? void 0 : context.right) || (context == null ? void 0 : context.left) || !(context == null ? void 0 : context.right) && !(context == null ? void 0 : context.left) && !(context == null ? void 0 : context.top) && !(context == null ? void 0 : context.bottom),
        "py-1 px-0": (context == null ? void 0 : context.top) || (context == null ? void 0 : context.bottom)
      }
    ]
  }),
  arrow: ({ context, props }) => ({
    class: [
      // Position
      "absolute",
      // Size
      "w-0",
      "h-0",
      // Shape
      "border-transparent",
      "border-solid",
      {
        "border-y-[0.25rem] border-r-[0.25rem] border-l-0 border-r-surface-600": (context == null ? void 0 : context.right) || !(context == null ? void 0 : context.right) && !(context == null ? void 0 : context.left) && !(context == null ? void 0 : context.top) && !(context == null ? void 0 : context.bottom),
        "border-y-[0.25rem] border-l-[0.25rem] border-r-0 border-l-surface-600": context == null ? void 0 : context.left,
        "border-x-[0.25rem] border-t-[0.25rem] border-b-0 border-t-surface-600": context == null ? void 0 : context.top,
        "border-x-[0.25rem] border-b-[0.25rem] border-t-0 border-b-surface-600": context == null ? void 0 : context.bottom
      },
      // Spacing
      {
        "-mt-1 ": (context == null ? void 0 : context.right) || !(context == null ? void 0 : context.right) && !(context == null ? void 0 : context.left) && !(context == null ? void 0 : context.top) && !(context == null ? void 0 : context.bottom),
        "-mt-1": context == null ? void 0 : context.left,
        "-ml-1": (context == null ? void 0 : context.top) || (context == null ? void 0 : context.bottom)
      }
    ]
  }),
  text: {
    class: ["p-3", "bg-surface-600 dark:bg-surface-700", "text-white", "leading-none", "rounded-md", "whitespace-pre-line", "break-words"]
  }
};
const tree = {
  root: {
    class: [
      // Space
      "p-5",
      // Shape
      "rounded-md",
      // Color
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-700 dark:text-white/80",
      "border border-solid border-surface-200 dark:border-surface-700"
    ]
  },
  wrapper: {
    class: ["overflow-auto"]
  },
  container: {
    class: [
      // Spacing
      "m-0 p-0",
      // Misc
      "list-none overflow-auto"
    ]
  },
  node: {
    class: ["p-1", "rounded-md", "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-inset focus:ring-primary-400/50 dark:focus:ring-primary-300/50"]
  },
  content: ({ context, props }) => ({
    class: [
      // Flex and Alignment
      "flex items-center",
      // Shape
      "rounded-md",
      // Spacing
      "p-2",
      // Colors
      "text-surface-600 dark:text-white/70",
      { "bg-primary-50 dark:bg-primary-400/30 text-primary-600 dark:text-surface-0": context.selected },
      // States
      { "hover:bg-surface-50 dark:hover:bg-surface-700/40": (props.selectionMode == "single" || props.selectionMode == "multiple") && !context.selected },
      // Transition
      "transition-shadow duration-200",
      { "cursor-pointer select-none": props.selectionMode == "single" || props.selectionMode == "multiple" }
    ]
  }),
  toggler: ({ context }) => ({
    class: [
      // Flex and Alignment
      "inline-flex items-center justify-center",
      // Shape
      "border-0 rounded-full",
      // Size
      "w-8 h-8",
      // Spacing
      "mr-2",
      // Colors
      "bg-transparent",
      {
        "text-surface-500 dark:text-white": !context.selected,
        "text-primary-600 dark:text-white": context.selected,
        invisible: context.leaf
      },
      // States
      "hover:bg-surface-200/20 dark:hover:bg-surface-500/20",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
      // Transition
      "transition duration-200",
      // Misc
      "cursor-pointer select-none"
    ]
  }),
  nodeCheckbox: {
    root: {
      class: [
        "relative",
        // Alignment
        "inline-flex",
        "align-bottom",
        // Size
        "w-6",
        "h-6",
        // Spacing
        "mr-2",
        // Misc
        "cursor-pointer",
        "select-none"
      ]
    },
    box: ({ props, context }) => ({
      class: [
        // Alignment
        "flex",
        "items-center",
        "justify-center",
        // Size
        "w-6",
        "h-6",
        // Shape
        "rounded-md",
        "border-2",
        // Colors
        {
          "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
          "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
        },
        // States
        {
          "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
          "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
          "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
          "cursor-default opacity-60": props.disabled
        },
        // Transitions
        "transition-colors",
        "duration-200"
      ]
    }),
    input: {
      class: [
        "peer",
        // Size
        "w-full ",
        "h-full",
        // Position
        "absolute",
        "top-0 left-0",
        "z-10",
        // Spacing
        "p-0",
        "m-0",
        // Shape
        "opacity-0",
        "rounded-md",
        "outline-none",
        "border-2 border-surface-200 dark:border-surface-700",
        // Misc
        "appareance-none",
        "cursor-pointer"
      ]
    },
    icon: {
      class: [
        // Font
        "text-base leading-none",
        // Size
        "w-4",
        "h-4",
        // Colors
        "text-white dark:text-surface-900",
        // Transitions
        "transition-all",
        "duration-200"
      ]
    }
  },
  nodeicon: {
    class: [
      // Space
      "mr-2",
      // Color
      "text-surface-600 dark:text-white/70"
    ]
  },
  subgroup: {
    class: ["m-0 list-none p-0 pl-2 mt-1"]
  },
  filtercontainer: {
    class: [
      "relative block",
      // Space
      "mb-2",
      // Size
      "w-full"
    ]
  },
  input: {
    class: [
      "relative",
      // Font
      "font-sans leading-none",
      // Spacing
      "m-0",
      "p-3 pr-10",
      // Size
      "w-full",
      // Shape
      "rounded-md",
      // Colors
      "text-surface-600 dark:text-surface-200",
      "placeholder:text-surface-400 dark:placeholder:text-surface-500",
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-600",
      // States
      "hover:border-primary-500 dark:hover:border-primary-400",
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50",
      // Transition & Misc
      "appearance-none",
      "transition-colors duration-200"
    ]
  },
  loadingicon: {
    class: ["text-surface-500 dark:text-surface-0/70", "absolute top-[50%] right-[50%] -mt-2 -mr-2 animate-spin"]
  },
  searchicon: {
    class: [
      // Position
      "absolute top-1/2 -mt-2 right-3",
      // Color
      "text-surface-600 dark:hover:text-white/70"
    ]
  }
};
const treeselect = {
  root: ({ props, state }) => ({
    class: [
      // Display and Position
      "inline-flex",
      "relative",
      // Shape
      "rounded-md",
      // Color and Background
      "bg-surface-0 dark:bg-surface-900",
      "border border-surface-300 dark:border-surface-700",
      // Transitions
      "transition-all",
      "duration-200",
      // States
      "hover:border-primary-500 dark:hover:border-primary-300",
      { "outline-none outline-offset-0 ring ring-primary-400/50 dark:ring-primary-300/50": state.focused },
      // Misc
      "cursor-pointer",
      "select-none",
      { "opacity-60": props.disabled, "pointer-events-none": props.disabled, "cursor-default": props.disabled }
    ]
  }),
  labelContainer: {
    class: ["overflow-hidden flex flex-auto cursor-pointer"]
  },
  label: {
    class: [
      "block leading-5",
      // Space
      "p-3",
      // Color
      "text-surface-800 dark:text-white/80",
      // Transition
      "transition duration-200",
      // Misc
      "overflow-hidden whitespace-nowrap cursor-pointer overflow-ellipsis"
    ]
  },
  trigger: {
    class: [
      // Flexbox
      "flex items-center justify-center",
      "shrink-0",
      // Color and Background
      "bg-transparent",
      "text-surface-500",
      // Size
      "w-12",
      // Shape
      "rounded-tr-md",
      "rounded-br-md"
    ]
  },
  panel: {
    class: [
      // Position
      "absolute top-0 left-0",
      // Shape
      "border-0 dark:border",
      "rounded-md",
      "shadow-md",
      // Color
      "bg-surface-0 dark:bg-surface-800",
      "text-surface-800 dark:text-white/80",
      "dark:border-surface-700"
    ]
  },
  wrapper: {
    class: [
      // Sizing
      "max-h-[200px]",
      // Misc
      "overflow-auto"
    ]
  },
  tree: {
    root: {
      class: [
        // Space
        "p-5"
      ]
    },
    wrapper: {
      class: ["overflow-auto"]
    },
    container: {
      class: [
        // Spacing
        "m-0 p-0",
        // Misc
        "list-none overflow-auto"
      ]
    },
    node: {
      class: ["p-1", "rounded-md", "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-inset focus:ring-primary-400/50 dark:focus:ring-primary-300/50"]
    },
    content: ({ context, props }) => ({
      class: [
        // Flex and Alignment
        "flex items-center",
        // Shape
        "rounded-md",
        // Spacing
        "p-2",
        // Colors
        "text-surface-600 dark:text-white/70",
        { "bg-primary-50 dark:bg-primary-400/30 text-primary-600 dark:text-surface-0": context.selected },
        // States
        { "hover:bg-surface-50 dark:hover:bg-surface-700/40": (props.selectionMode == "single" || props.selectionMode == "multiple") && !context.selected },
        // Transition
        "transition-shadow duration-200",
        { "cursor-pointer select-none": props.selectionMode == "single" || props.selectionMode == "multiple" }
      ]
    }),
    toggler: ({ context }) => ({
      class: [
        // Flex and Alignment
        "inline-flex items-center justify-center",
        // Shape
        "border-0 rounded-full",
        // Size
        "w-8 h-8",
        // Spacing
        "mr-2",
        // Colors
        "bg-transparent",
        {
          "text-surface-500 dark:text-white": !context.selected,
          "text-primary-600 dark:text-white": context.selected,
          invisible: context.leaf
        },
        // States
        "hover:bg-surface-200/20 dark:hover:bg-surface-500/20",
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50",
        // Transition
        "transition duration-200",
        // Misc
        "cursor-pointer select-none"
      ]
    }),
    nodeCheckbox: {
      root: {
        class: [
          "relative",
          // Alignment
          "inline-flex",
          "align-bottom",
          // Size
          "w-6",
          "h-6",
          // Spacing
          "mr-2",
          // Misc
          "cursor-pointer",
          "select-none"
        ]
      },
      box: ({ props, context }) => ({
        class: [
          // Alignment
          "flex",
          "items-center",
          "justify-center",
          // Size
          "w-6",
          "h-6",
          // Shape
          "rounded-md",
          "border-2",
          // Colors
          {
            "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
            "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
          },
          // States
          {
            "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
            "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
            "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
            "cursor-default opacity-60": props.disabled
          },
          // Transitions
          "transition-colors",
          "duration-200"
        ]
      }),
      input: {
        class: [
          "peer",
          // Size
          "w-full ",
          "h-full",
          // Position
          "absolute",
          "top-0 left-0",
          "z-10",
          // Spacing
          "p-0",
          "m-0",
          // Shape
          "opacity-0",
          "rounded-md",
          "outline-none",
          "border-2 border-surface-200 dark:border-surface-700",
          // Misc
          "appareance-none",
          "cursor-pointer"
        ]
      },
      icon: {
        class: [
          // Font
          "text-base leading-none",
          // Size
          "w-4",
          "h-4",
          // Colors
          "text-white dark:text-surface-900",
          // Transitions
          "transition-all",
          "duration-200"
        ]
      }
    },
    nodeicon: {
      class: [
        // Space
        "mr-2",
        // Color
        "text-surface-600 dark:text-white/70"
      ]
    },
    subgroup: {
      class: ["m-0 list-none p-0 pl-2 mt-1"]
    },
    filtercontainer: {
      class: [
        "relative block",
        // Space
        "mb-2",
        // Size
        "w-full"
      ]
    },
    input: {
      class: [
        "relative",
        // Font
        "font-sans leading-none",
        // Spacing
        "m-0",
        "p-3 pr-10",
        // Size
        "w-full",
        // Shape
        "rounded-md",
        // Colors
        "text-surface-600 dark:text-surface-200",
        "placeholder:text-surface-400 dark:placeholder:text-surface-500",
        "bg-surface-0 dark:bg-surface-900",
        "border border-surface-300 dark:border-surface-600",
        // States
        "hover:border-primary-500 dark:hover:border-primary-400",
        "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50",
        // Transition & Misc
        "appearance-none",
        "transition-colors duration-200"
      ]
    },
    loadingicon: {
      class: ["text-surface-500 dark:text-surface-0/70", "absolute top-[50%] right-[50%] -mt-2 -mr-2 animate-spin"]
    },
    searchicon: {
      class: [
        // Position
        "absolute top-1/2 -mt-2 right-3",
        // Color
        "text-surface-600 dark:hover:text-white/70"
      ]
    }
  },
  transition: {
    enterFromClass: "opacity-0 scale-y-[0.8]",
    enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
    leaveActiveClass: "transition-opacity duration-100 ease-linear",
    leaveToClass: "opacity-0"
  }
};
const treetable = {
  root: ({ props }) => ({
    class: [
      "relative",
      {
        "flex flex-col h-full": props.scrollHeight === "flex"
      }
    ]
  }),
  loadingoverlay: {
    class: [
      // Position
      "absolute",
      "top-0 left-0",
      "z-20",
      // Flex & Alignment
      "flex items-center justify-center",
      // Size
      "w-full h-full",
      // Color
      "bg-surface-100/40 dark:bg-surface-800/40",
      // Transition
      "transition duration-200"
    ]
  },
  loadingicon: {
    class: "w-8 h-8 animate-spin"
  },
  wrapper: ({ props }) => ({
    class: [
      // Overflow
      {
        "relative overflow-auto": props.scrollable,
        "overflow-x-auto": props.resizableColumns
      }
    ]
  }),
  header: ({ props }) => ({
    class: [
      "font-bold",
      // Shape
      props.showGridlines ? "border-x border-t border-b-0" : "border-y border-x-0",
      // Spacing
      "p-4",
      // Color
      "bg-surface-50 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700",
      "text-surface-700 dark:text-white/80"
    ]
  }),
  footer: {
    class: [
      // Background, Border & Text
      "bg-slate-50 text-slate-700",
      "border border-x-0 border-t-0 border-surface-50",
      // Padding & Font
      "p-4 font-bold",
      // Dark Mode
      "dark:bg-surface-900 dark:text-white/70 dark:border-surface-700"
    ]
  },
  table: {
    class: [
      // Table & Width
      "border-collapse table-fixed w-full "
    ]
  },
  thead: ({ props }) => ({
    class: [
      // Position & Z-index
      {
        "top-0 z-40 sticky": props.scrollable
      }
    ]
  }),
  tbody: ({ props }) => ({
    class: [
      // Block Display
      {
        block: props.scrollable
      }
    ]
  }),
  tfoot: ({ props }) => ({
    class: [
      // Block Display
      {
        block: props.scrollable
      }
    ]
  }),
  headerrow: ({ props }) => ({
    class: [
      // Flexbox & Width
      {
        "flex flex-nowrap w-full": props.scrollable
      }
    ]
  }),
  row: ({ context, props }) => ({
    class: [
      // Flex
      { "flex flex-nowrap w-full": context.scrollable },
      // Color
      "dark:text-white/80",
      { "bg-primary-50 text-primary-700 dark:bg-primary-400/30": context.selected },
      { "bg-surface-0 text-surface-600 dark:bg-surface-800": !context.selected },
      // Hover & Flexbox
      {
        "hover:bg-surface-300/20 hover:text-surface-600": context.selectable && !context.selected
      },
      "focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 ring-inset dark:focus:ring-primary-300/50",
      // Transition
      { "transition duration-200": props.selectionMode && !context.selected || props.rowHover }
    ]
  }),
  headercell: ({ context, props }) => ({
    class: [
      "font-bold",
      // Position
      { "sticky z-40": context.scrollable && context.scrollDirection === "both" && context.frozen },
      // Flex & Alignment
      {
        "flex flex-1 items-center": context.scrollable,
        "flex-initial shrink-0": context.scrollable && context.scrollDirection === "both" && !context.frozen
      },
      "text-left",
      // Shape
      { "first:border-l border-y border-r": context == null ? void 0 : context.showGridlines },
      "border-0 border-b border-solid",
      // Spacing
      (context == null ? void 0 : context.size) === "small" ? "p-2" : (context == null ? void 0 : context.size) === "large" ? "p-5" : "p-4",
      // Color
      (props.sortable === "" || props.sortable) && context.sorted ? "bg-primary-50 text-primary-700" : "bg-surface-50 text-surface-700",
      (props.sortable === "" || props.sortable) && context.sorted ? "dark:text-white dark:bg-primary-400/30" : "dark:text-white/80 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-700",
      // States
      { "hover:bg-surface-100 dark:hover:bg-surface-400/30": (props.sortable === "" || props.sortable) && !(context == null ? void 0 : context.sorted) },
      "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
      // Transition
      { "transition duration-200": props.sortable === "" || props.sortable },
      // Misc
      {
        "overflow-hidden relative bg-clip-padding": context.resizable && !context.frozen
      }
    ]
  }),
  column: {
    headercell: ({ context, props }) => ({
      class: [
        "font-bold",
        // Position
        { "sticky z-40": context.scrollable && context.scrollDirection === "both" && context.frozen },
        // Flex & Alignment
        {
          "flex flex-1 items-center": context.scrollable,
          "flex-initial shrink-0": context.scrollable && context.scrollDirection === "both" && !context.frozen
        },
        "text-left",
        // Shape
        { "first:border-l border-y border-r": context == null ? void 0 : context.showGridlines },
        "border-0 border-b border-solid",
        // Spacing
        (context == null ? void 0 : context.size) === "small" ? "p-2" : (context == null ? void 0 : context.size) === "large" ? "p-5" : "p-4",
        // Color
        (props.sortable === "" || props.sortable) && context.sorted ? "bg-primary-50 text-primary-700" : "bg-surface-50 text-surface-700",
        (props.sortable === "" || props.sortable) && context.sorted ? "dark:text-white dark:bg-primary-400/30" : "dark:text-white/80 dark:bg-surface-800",
        "border-surface-200 dark:border-surface-700",
        // States
        { "hover:bg-surface-100 dark:hover:bg-surface-400/30": (props.sortable === "" || props.sortable) && !(context == null ? void 0 : context.sorted) },
        "focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
        // Transition
        { "transition duration-200": props.sortable === "" || props.sortable },
        // Misc
        {
          "overflow-hidden relative bg-clip-padding": context.resizable && !context.frozen
        }
      ]
    }),
    bodycell: ({ context }) => ({
      class: [
        // Position
        {
          sticky: context.scrollable && context.scrollDirection === "both" && context.frozen
        },
        // Flex & Alignment
        {
          "flex flex-1 items-center": context.scrollable,
          "flex-initial shrink-0": context.scrollable && context.scrollDirection === "both" && !context.frozen
        },
        "text-left",
        // Shape
        "border-0 border-b border-solid",
        "border-surface-200 dark:border-surface-700",
        {
          "border-x-0 border-l-0": !context.showGridlines
        },
        { "first:border-l border-r border-b": context == null ? void 0 : context.showGridlines },
        // Color
        "bg-surface-0 dark:bg-surface-800",
        // Spacing
        (context == null ? void 0 : context.size) === "small" ? "p-2" : (context == null ? void 0 : context.size) === "large" ? "p-5" : "p-4",
        // Misc
        "dark:border-surface-700",
        {
          "cursor-pointer": context.selectable,
          sticky: context.scrollable && context.scrollDirection === "both" && context.frozen,
          "border-x-0 border-l-0": !context.showGridlines
        }
      ]
    }),
    rowtoggler: {
      class: [
        "relative",
        // Flex & Alignment
        "inline-flex items-center justify-center",
        "text-left align-middle",
        // Spacing
        "m-0 mr-2 p-0",
        // Size
        "w-8 h-8",
        // Shape
        "border-0 rounded-full",
        // Color
        "text-surface-500 dark:text-white/70",
        "bg-transparent",
        // States
        "hover:bg-surface-50 dark:hover:bg-surface-700",
        "focus-visible:outline-none focus-visible:outline-offset-0",
        "focus-visible:ring focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50",
        // Transition
        "transition duration-200",
        // Misc
        "overflow-hidden",
        "cursor-pointer select-none"
      ]
    },
    sorticon: ({ context }) => ({
      class: ["ml-2 inline-block", context.sorted ? "fill-primary-700 dark:fill-white/80" : "fill-surface-700 dark:fill-white/70"]
    }),
    sortbadge: {
      class: [
        // Flex & Alignment
        "inline-flex items-center justify-center align-middle",
        // Shape
        "rounded-full",
        // Size
        "w-[1.143rem] leading-[1.143rem]",
        // Spacing
        "ml-2",
        // Color
        "text-primary-700 dark:text-white",
        "bg-primary-50 dark:bg-primary-400/30"
      ]
    },
    columnresizer: {
      class: [
        "block",
        // Position
        "absolute top-0 right-0",
        // Sizing
        "w-2 h-full",
        // Spacing
        "m-0 p-0",
        // Color
        "border border-transparent",
        // Misc
        "cursor-col-resize"
      ]
    },
    rowCheckbox: {
      root: {
        class: [
          "relative",
          // Alignment
          "inline-flex",
          "align-middle",
          // Size
          "w-6",
          "h-6",
          // Spacing
          "mr-2",
          // Misc
          "cursor-pointer",
          "select-none"
        ]
      },
      box: ({ props, context }) => ({
        class: [
          // Alignment
          "flex",
          "items-center",
          "justify-center",
          // Size
          "w-6",
          "h-6",
          // Shape
          "rounded-md",
          "border-2",
          // Colors
          {
            "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.checked,
            "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.checked
          },
          // States
          {
            "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.checked,
            "peer-hover:bg-primary-700 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.checked,
            "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
            "cursor-default opacity-60": props.disabled
          },
          // Transitions
          "transition-colors",
          "duration-200"
        ]
      }),
      input: {
        class: [
          "peer",
          // Size
          "w-full ",
          "h-full",
          // Position
          "absolute",
          "top-0 left-0",
          "z-10",
          // Spacing
          "p-0",
          "m-0",
          // Shape
          "opacity-0",
          "rounded-md",
          "outline-none",
          "border-2 border-surface-200 dark:border-surface-700",
          // Misc
          "appareance-none",
          "cursor-pointer"
        ]
      },
      icon: {
        class: [
          // Font
          "text-base leading-none",
          // Size
          "w-4",
          "h-4",
          // Colors
          "text-white dark:text-surface-900",
          // Transitions
          "transition-all",
          "duration-200"
        ]
      }
    },
    transition: {
      enterFromClass: "opacity-0 scale-y-[0.8]",
      enterActiveClass: "transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]",
      leaveActiveClass: "transition-opacity duration-100 ease-linear",
      leaveToClass: "opacity-0"
    }
  },
  resizehelper: {
    class: "absolute hidden w-[2px] z-20 bg-primary-500 dark:bg-primary-400"
  }
};
const tristatecheckbox = {
  root: {
    class: ["cursor-pointer inline-flex relative select-none align-bottom", "w-6 h-6"]
  },
  input: {
    class: [
      "peer",
      // Size
      "w-full ",
      "h-full",
      // Position
      "absolute",
      "top-0 left-0",
      "z-10",
      // Spacing
      "p-0",
      "m-0",
      // Shape
      "opacity-0",
      "rounded-md",
      "outline-none",
      "border-2 border-surface-200 dark:border-surface-700",
      // Misc
      "appareance-none",
      "cursor-pointer"
    ]
  },
  box: ({ props, context }) => ({
    class: [
      // Alignment
      "flex",
      "items-center",
      "justify-center",
      // Size
      "w-6",
      "h-6",
      // Shape
      "rounded-md",
      "border-2",
      // Colors
      {
        "border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-900": !context.active,
        "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400": context.active
      },
      // States
      {
        "peer-hover:border-primary-500 dark:peer-hover:border-primary-400": !props.disabled && !context.active,
        "peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300": !props.disabled && context.active,
        "peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20": !props.disabled,
        "cursor-default opacity-60": props.disabled
      },
      // Transitions
      "transition-colors",
      "duration-200"
    ]
  }),
  checkicon: {
    class: [
      // Font
      "text-base leading-none",
      // Size
      "w-4",
      "h-4",
      // Colors
      "text-white dark:text-surface-900",
      // Transitions
      "transition-all",
      "duration-200"
    ]
  },
  uncheckicon: {
    class: [
      // Font
      "text-base leading-none",
      // Size
      "w-4",
      "h-4",
      // Colors
      "text-white dark:text-surface-900",
      // Transitions
      "transition-all",
      "duration-200"
    ]
  }
};
const Lara = {
  global: global$1,
  directives: {
    badge: badgedirective,
    ripple,
    tooltip
  },
  //forms
  autocomplete,
  dropdown,
  inputnumber,
  inputtext,
  calendar,
  checkbox,
  radiobutton,
  inputswitch,
  selectbutton,
  slider,
  chips,
  rating,
  multiselect,
  togglebutton,
  cascadeselect,
  listbox,
  colorpicker,
  inputgroup,
  inputgroupaddon,
  inputmask,
  knob,
  treeselect,
  tristatecheckbox,
  textarea,
  password,
  //buttons
  button,
  splitbutton,
  speeddial,
  //data
  paginator,
  datatable,
  tree,
  dataview,
  dataviewlayoutoptions,
  organizationchart,
  orderlist,
  picklist,
  treetable,
  timeline,
  //panels
  accordion,
  panel,
  fieldset,
  card,
  tabview,
  divider,
  toolbar,
  scrollpanel,
  //menu
  contextmenu,
  menu,
  menubar,
  steps,
  tieredmenu,
  breadcrumb,
  panelmenu,
  megamenu,
  dock,
  tabmenu,
  //overlays
  dialog,
  overlaypanel,
  sidebar,
  confirmpopup,
  //messages
  message,
  inlinemessage,
  toast,
  //media
  carousel,
  galleria,
  image,
  //misc
  badge,
  avatar,
  avatargroup,
  tag,
  chip,
  progressbar,
  skeleton,
  scrolltop,
  terminal,
  blockui
};
const primevue_plugin_egKpok8Auk = /* @__PURE__ */ defineNuxtPlugin(({ vueApp }) => {
  var _a;
  const runtimeConfig = /* @__PURE__ */ useRuntimeConfig();
  const config = ((_a = runtimeConfig == null ? void 0 : runtimeConfig.public) == null ? void 0 : _a.primevue) ?? {};
  const { usePrimeVue = true, options = {} } = config;
  const pt = { pt: Lara };
  usePrimeVue && vueApp.use(PrimeVue, { ...options, ...pt });
  vueApp.use(ConfirmationService);
  vueApp.use(DialogService);
  vueApp.use(ToastService);
  vueApp.directive("badge", BadgeDirective);
  vueApp.directive("tooltip", Tooltip);
  vueApp.directive("ripple", Ripple);
  vueApp.directive("styleclass", StyleClass);
  vueApp.directive("focustrap", FocusTrap);
  vueApp.directive("animateonscroll", AnimateOnScroll);
});
const css = ``;
const font_fallback_inlining_plugin_server_0jIQFwhKjU = /* @__PURE__ */ defineNuxtPlugin(() => {
  useHead({ style: [{ children: css + __INLINED_CSS__ }] });
});
const clientOnlySymbol = Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  // eslint-disable-next-line vue/require-prop-types
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  setup(_, { slots, attrs }) {
    const mounted6 = ref(false);
    provide(clientOnlySymbol, true);
    return (props) => {
      var _a;
      if (mounted6.value) {
        return (_a = slots.default) == null ? void 0 : _a.call(slots);
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return slot();
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const enabled = /* @__PURE__ */ new WeakSet();
function autoAnimate(el, config = {}) {
  return Object.freeze({
    parent: el,
    enable: () => {
      enabled.add(el);
    },
    disable: () => {
      enabled.delete(el);
    },
    isEnabled: () => enabled.has(el)
  });
}
const vAutoAnimate$1 = {
  mounted: (el, binding) => {
    autoAnimate(el, binding.value || {});
  },
  // ignore ssr see #96:
  getSSRProps: () => ({})
};
const vAutoAnimate = vAutoAnimate$1;
const plugin_tMGwffvjBc = /* @__PURE__ */ defineNuxtPlugin((app) => {
  app.vueApp.directive("auto-animate", vAutoAnimate);
});
const plugins = [
  unhead_KgADcZ0jPj,
  plugin,
  revive_payload_server_eJ33V7gbc6,
  components_plugin_KR1HBZs4kY,
  primevue_plugin_egKpok8Auk,
  font_fallback_inlining_plugin_server_0jIQFwhKjU,
  plugin_tMGwffvjBc
];
const layouts = {
  "main-layout": () => import("./_nuxt/MainLayout-Y-a78knF.js").then((m) => m.default || m)
};
const LayoutLoader = defineComponent({
  name: "LayoutLoader",
  inheritAttrs: false,
  props: {
    name: String,
    layoutProps: Object
  },
  async setup(props, context) {
    const LayoutComponent = await layouts[props.name]().then((r) => r.default || r);
    return () => h(LayoutComponent, props.layoutProps, context.slots);
  }
});
const __nuxt_component_0 = defineComponent({
  name: "NuxtLayout",
  inheritAttrs: false,
  props: {
    name: {
      type: [String, Boolean, Object],
      default: null
    },
    fallback: {
      type: [String, Object],
      default: null
    }
  },
  setup(props, context) {
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const injectedRoute = inject(PageRouteSymbol);
    const route = injectedRoute === useRoute() ? useRoute$1() : injectedRoute;
    const layout = computed(() => {
      let layout2 = unref(props.name) ?? route.meta.layout ?? "default";
      if (layout2 && !(layout2 in layouts)) {
        if (props.fallback) {
          layout2 = unref(props.fallback);
        }
      }
      return layout2;
    });
    const layoutRef = ref();
    context.expose({ layoutRef });
    const done = nuxtApp.deferHydration();
    return () => {
      const hasLayout = layout.value && layout.value in layouts;
      const transitionProps = route.meta.layoutTransition ?? appLayoutTransition;
      return _wrapIf(Transition, hasLayout && transitionProps, {
        default: () => h(Suspense, { suspensible: true, onResolve: () => {
          nextTick(done);
        } }, {
          default: () => h(
            LayoutProvider,
            {
              layoutProps: mergeProps(context.attrs, { ref: layoutRef }),
              key: layout.value || void 0,
              name: layout.value,
              shouldProvide: !props.name,
              hasTransition: !!transitionProps
            },
            context.slots
          )
        })
      }).default();
    };
  }
});
const LayoutProvider = defineComponent({
  name: "NuxtLayoutProvider",
  inheritAttrs: false,
  props: {
    name: {
      type: [String, Boolean]
    },
    layoutProps: {
      type: Object
    },
    hasTransition: {
      type: Boolean
    },
    shouldProvide: {
      type: Boolean
    }
  },
  setup(props, context) {
    const name = props.name;
    if (props.shouldProvide) {
      provide(LayoutMetaSymbol, {
        isCurrent: (route) => name === (route.meta.layout ?? "default")
      });
    }
    return () => {
      var _a, _b;
      if (!name || typeof name === "string" && !(name in layouts)) {
        return (_b = (_a = context.slots).default) == null ? void 0 : _b.call(_a);
      }
      return h(
        LayoutLoader,
        { key: name, layoutProps: props.layoutProps, name },
        context.slots
      );
    };
  }
});
const RouteProvider = defineComponent({
  props: {
    vnode: {
      type: Object,
      required: true
    },
    route: {
      type: Object,
      required: true
    },
    vnodeRef: Object,
    renderKey: String,
    trackRootNodes: Boolean
  },
  setup(props) {
    const previousKey = props.renderKey;
    const previousRoute = props.route;
    const route = {};
    for (const key in props.route) {
      Object.defineProperty(route, key, {
        get: () => previousKey === props.renderKey ? props.route[key] : previousRoute[key]
      });
    }
    provide(PageRouteSymbol, shallowReactive(route));
    return () => {
      return h(props.vnode, { ref: props.vnodeRef });
    };
  }
});
const __nuxt_component_1 = defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    transition: {
      type: [Boolean, Object],
      default: void 0
    },
    keepalive: {
      type: [Boolean, Object],
      default: void 0
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs, expose }) {
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const pageRef = ref();
    const forkRoute = inject(PageRouteSymbol, null);
    let previousPageKey;
    expose({ pageRef });
    inject(LayoutMetaSymbol, null);
    let vnode;
    const done = nuxtApp.deferHydration();
    if (props.pageKey) {
      watch(() => props.pageKey, (next, prev) => {
        if (next !== prev) {
          nuxtApp.callHook("page:loading:start");
        }
      });
    }
    return () => {
      return h(RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => {
          if (!routeProps.Component) {
            done();
            return;
          }
          const key = generateRouteKey$1(routeProps, props.pageKey);
          if (!nuxtApp.isHydrating && !hasChildrenRoutes(forkRoute, routeProps.route, routeProps.Component) && previousPageKey === key) {
            nuxtApp.callHook("page:loading:end");
          }
          previousPageKey = key;
          const hasTransition = !!(props.transition ?? routeProps.route.meta.pageTransition ?? appPageTransition);
          const transitionProps = hasTransition && _mergeTransitionProps([
            props.transition,
            routeProps.route.meta.pageTransition,
            appPageTransition,
            { onAfterLeave: () => {
              nuxtApp.callHook("page:transition:finish", routeProps.Component);
            } }
          ].filter(Boolean));
          const keepaliveConfig = props.keepalive ?? routeProps.route.meta.keepalive ?? appKeepalive;
          vnode = _wrapIf(
            Transition,
            hasTransition && transitionProps,
            wrapInKeepAlive(
              keepaliveConfig,
              h(Suspense, {
                suspensible: true,
                onPending: () => nuxtApp.callHook("page:start", routeProps.Component),
                onResolve: () => {
                  nextTick(() => nuxtApp.callHook("page:finish", routeProps.Component).then(() => nuxtApp.callHook("page:loading:end")).finally(done));
                }
              }, {
                default: () => {
                  const providerVNode = h(RouteProvider, {
                    key: key || void 0,
                    vnode: routeProps.Component,
                    route: routeProps.route,
                    renderKey: key || void 0,
                    trackRootNodes: hasTransition,
                    vnodeRef: pageRef
                  });
                  return providerVNode;
                }
              })
            )
          ).default();
          return vnode;
        }
      });
    };
  }
});
function _mergeTransitionProps(routeProps) {
  const _props = routeProps.map((prop) => ({
    ...prop,
    onAfterLeave: prop.onAfterLeave ? toArray(prop.onAfterLeave) : void 0
  }));
  return defu(..._props);
}
function hasChildrenRoutes(fork, newRoute, Component) {
  if (!fork) {
    return false;
  }
  const index2 = newRoute.matched.findIndex((m) => {
    var _a;
    return ((_a = m.components) == null ? void 0 : _a.default) === (Component == null ? void 0 : Component.type);
  });
  return index2 < newRoute.matched.length - 1;
}
const _sfc_main$2 = {
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "My App",
      meta: [
        { name: "description", content: "My amazing site." },
        { name: "robots", content: "index, follow" },
        { name: "author", content: "Bartosz Lemanek" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "keywords", content: "keyword1, keyword2, keyword3" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLayout = __nuxt_component_0;
      const _component_NuxtPage = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_NuxtLayout, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_NuxtPage, null, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_NuxtPage)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = _sfc_main$2;
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    (_error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n");
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import("./_nuxt/error-404-gqnav3Gc.js").then((r) => r.default || r));
    const _Error = defineAsyncComponent(() => import("./_nuxt/error-500-RaKGnAuD.js").then((r) => r.default || r));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ErrorComponent = _sfc_main$1;
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = defineAsyncComponent(() => import("./_nuxt/island-renderer-VbkV5w9j.js").then((r) => r.default || r));
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const RootComponent = _sfc_main;
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(RootComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error = nuxt.payload.error || createError(error);
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ssrContext) => entry(ssrContext);
export {
  BaseStyle as B,
  ConnectedOverlayScrollHandler as C,
  DomHandler as D,
  FilterService as F,
  ObjectUtils as O,
  Ripple as R,
  Tooltip as T,
  UniqueComponentId as U,
  ZIndexUtils as Z,
  _default as _,
  useRuntimeConfig as a,
  navigateTo as b,
  createError as c,
  useHead as d,
  entry$1 as default,
  useNuxtApp as e,
  useStyle as f,
  FilterOperator as g,
  FilterMatchMode as h,
  FocusTrap as i,
  ConfirmationEventBus as j,
  DynamicDialogEventBus as k,
  ToastEventBus as l,
  nuxtLinkDefaults as n,
  primebus as p,
  useRouter as u
};
//# sourceMappingURL=server.mjs.map
