import script from "./menubar.esm-ZkNxEeRa.js";
import script$1 from "./badge.esm-ghUiACLO.js";
import __nuxt_component_1 from "./Icon-pEPLX9qs.js";
import { mergeProps, useSSRContext, defineComponent, ref, resolveDirective, withCtx, withDirectives, openBlock, createBlock, createVNode, toDisplayString, createCommentVNode } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrGetDirectiveProps, ssrRenderClass, ssrRenderSlot } from "vue/server-renderer";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-yVxbj29m.js";
import "./index.esm-6uJ27MAP.js";
import "./baseicon.esm-URWkj5Lr.js";
import "./basecomponent.esm-qug9g1zs.js";
import "../server.mjs";
import "#internal/nitro";
import "ofetch";
import "hookable";
import "unctx";
import "h3";
import "unhead";
import "@unhead/shared";
import "vue-router";
import "ufo";
import "defu";
import "klona";
import "devalue";
import "destr";
import "./index.esm-SLa1xPfn.js";
import "./index.esm-dmoNeyzs.js";
import "./index-iqfXiNMh.js";
import "@iconify/vue/dist/offline";
import "@iconify/vue";
const _sfc_main$1 = {
  methods: {
    getCurrentYear() {
      return (/* @__PURE__ */ new Date()).getFullYear();
    }
  }
};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_Icon = __nuxt_component_1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "footer-bg" }, _attrs))} data-v-8c044ad9><footer class="text-black py-4 h-full" data-v-8c044ad9><div class="wrapper mx-auto flex flex-col md:flex-row justify-between items-center gap-12 py-8" data-v-8c044ad9><div class="text-center md:text-left" data-v-8c044ad9><h3 class="text-lg font-semibold" data-v-8c044ad9>Contact</h3><p data-v-8c044ad9>`);
  _push(ssrRenderComponent(_component_Icon, { name: "bi:envelope" }, null, _parent));
  _push(` Email: example@example.com</p><p data-v-8c044ad9>`);
  _push(ssrRenderComponent(_component_Icon, { name: "bi:telephone" }, null, _parent));
  _push(` Phone number: 123-456-789</p></div><div class="text-center md:text-left mt-4 md:mt-0" data-v-8c044ad9><h3 class="text-lg font-semibold" data-v-8c044ad9>Navigation</h3><ul class="mt-2" data-v-8c044ad9><li class="hover:bg-white py-1 px-2 transition rounded-xl" data-v-8c044ad9><a href="/" data-v-8c044ad9>Home</a></li><li class="hover:bg-white py-1 px-2 transition rounded-xl" data-v-8c044ad9><a href="/" data-v-8c044ad9>Shop</a></li><li class="hover:bg-white py-1 px-2 transition rounded-xl" data-v-8c044ad9><a href="/" data-v-8c044ad9>About</a></li></ul></div><p class="text-center md:text-right" data-v-8c044ad9> © ${ssrInterpolate($options.getCurrentYear())} <span class="font-bold" data-v-8c044ad9>BeautyFin</span> All rights reserved. </p></div></footer></div>`);
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/Footer.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const Footer = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-8c044ad9"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "MainLayout",
  __ssrInlineRender: true,
  setup(__props) {
    const items = ref([
      {
        label: "Home"
      },
      {
        label: "Shop"
      },
      {
        label: "About"
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Menubar = script;
      const _component_Badge = script$1;
      const _component_Icon = __nuxt_component_1;
      const _directive_ripple = resolveDirective("ripple");
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "MainLayout",
        class: "w-full z-50"
      }, _attrs))}><div class="card">`);
      _push(ssrRenderComponent(_component_Menubar, {
        class: "wrapper bg-transparent border-none",
        model: items.value
      }, {
        item: withCtx(({ item, props, root }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<a${ssrRenderAttrs(mergeProps({ class: "flex items-center hover:bg-pink-50 transition rounded-xl" }, props.action, ssrGetDirectiveProps(_ctx, _directive_ripple)))}${_scopeId}><span class="${ssrRenderClass(item.icon)}"${_scopeId}></span><span class="ml-2 text-black"${_scopeId}>${ssrInterpolate(item.label)}</span>`);
            if (item.badge) {
              _push2(ssrRenderComponent(_component_Badge, {
                class: { "ml-auto": !root, "ml-2": root },
                value: item.badge
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (item.shortcut) {
              _push2(`<span class="ml-auto border border-surface-200 dark:border-surface-500 rounded-md bg-surface-100 dark:bg-surface-800 text-xs p-1"${_scopeId}>${ssrInterpolate(item.shortcut)}</span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</a>`);
          } else {
            return [
              withDirectives((openBlock(), createBlock("a", mergeProps({ class: "flex items-center hover:bg-pink-50 transition rounded-xl" }, props.action), [
                createVNode("span", {
                  class: item.icon
                }, null, 2),
                createVNode("span", { class: "ml-2 text-black" }, toDisplayString(item.label), 1),
                item.badge ? (openBlock(), createBlock(_component_Badge, {
                  key: 0,
                  class: { "ml-auto": !root, "ml-2": root },
                  value: item.badge
                }, null, 8, ["class", "value"])) : createCommentVNode("", true),
                item.shortcut ? (openBlock(), createBlock("span", {
                  key: 1,
                  class: "ml-auto border border-surface-200 dark:border-surface-500 rounded-md bg-surface-100 dark:bg-surface-800 text-xs p-1"
                }, toDisplayString(item.shortcut), 1)) : createCommentVNode("", true)
              ], 16)), [
                [_directive_ripple]
              ])
            ];
          }
        }),
        end: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex items-center gap-2 mr-4"${_scopeId}><button${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "uiw:user",
              class: "hover:bg-pink-50 transition rounded-[50%] p-2",
              size: "2.2em"
            }, null, _parent2, _scopeId));
            _push2(`</button><button${_scopeId}>`);
            _push2(ssrRenderComponent(_component_Icon, {
              name: "ion:bag-outline",
              class: "hover:bg-pink-50 transition rounded-[50%] p-2",
              size: "2.2em"
            }, null, _parent2, _scopeId));
            _push2(`</button><h1 class="absolute sm:flex hidden items-center left-[50%] -translate-x-1/2 text-4xl nanum-font"${_scopeId}> Logo </h1></div>`);
          } else {
            return [
              createVNode("div", { class: "flex items-center gap-2 mr-4" }, [
                createVNode("button", null, [
                  createVNode(_component_Icon, {
                    name: "uiw:user",
                    class: "hover:bg-pink-50 transition rounded-[50%] p-2",
                    size: "2.2em"
                  })
                ]),
                createVNode("button", null, [
                  createVNode(_component_Icon, {
                    name: "ion:bag-outline",
                    class: "hover:bg-pink-50 transition rounded-[50%] p-2",
                    size: "2.2em"
                  })
                ]),
                createVNode("h1", { class: "absolute sm:flex hidden items-center left-[50%] -translate-x-1/2 text-4xl nanum-font" }, " Logo ")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(ssrRenderComponent(Footer, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/MainLayout.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=MainLayout-b1fSwLX8.js.map
