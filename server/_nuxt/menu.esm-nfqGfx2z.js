import { O as OverlayEventBus } from "./overlayeventbus.esm-9zDOutdg.js";
import { s as script$3 } from "./portal.esm-GQNjR_5n.js";
import { B as BaseStyle, U as UniqueComponentId, Z as ZIndexUtils, D as DomHandler, C as ConnectedOverlayScrollHandler, O as ObjectUtils, R as Ripple } from "../server.mjs";
import { s as script$4 } from "./basecomponent.esm-qug9g1zs.js";
import { mergeProps, resolveDirective, openBlock, createElementBlock, createElementVNode, withDirectives, createBlock, resolveDynamicComponent, normalizeClass, createCommentVNode, toDisplayString, resolveComponent, withCtx, createVNode, Transition, renderSlot, Fragment, renderList, createTextVNode } from "vue";
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
import "vue/server-renderer";
var classes = {
  root: function root(_ref) {
    var instance = _ref.instance, props = _ref.props;
    return ["p-menu p-component", {
      "p-menu-overlay": props.popup,
      "p-ripple-disabled": instance.$primevue.config.ripple === false
    }];
  },
  start: "p-menu-start",
  menu: "p-menu-list p-reset",
  submenuHeader: "p-submenu-header",
  separator: "p-menuitem-separator",
  end: "p-menu-end",
  menuitem: function menuitem(_ref2) {
    var instance = _ref2.instance;
    return ["p-menuitem", {
      "p-focus": instance.id === instance.focusedOptionId,
      "p-disabled": instance.disabled()
    }];
  },
  content: "p-menuitem-content",
  action: "p-menuitem-link",
  icon: "p-menuitem-icon",
  label: "p-menuitem-text"
};
var MenuStyle = BaseStyle.extend({
  name: "menu",
  classes
});
var script$2 = {
  name: "BaseMenu",
  "extends": script$4,
  props: {
    popup: {
      type: Boolean,
      "default": false
    },
    model: {
      type: Array,
      "default": null
    },
    appendTo: {
      type: [String, Object],
      "default": "body"
    },
    autoZIndex: {
      type: Boolean,
      "default": true
    },
    baseZIndex: {
      type: Number,
      "default": 0
    },
    tabindex: {
      type: Number,
      "default": 0
    },
    ariaLabel: {
      type: String,
      "default": null
    },
    ariaLabelledby: {
      type: String,
      "default": null
    }
  },
  style: MenuStyle,
  provide: function provide() {
    return {
      $parentInstance: this
    };
  }
};
var script$1 = {
  name: "Menuitem",
  hostName: "Menu",
  "extends": script$4,
  inheritAttrs: false,
  emits: ["item-click"],
  props: {
    item: null,
    templates: null,
    id: null,
    focusedOptionId: null,
    index: null
  },
  methods: {
    getItemProp: function getItemProp(processedItem, name) {
      return processedItem && processedItem.item ? ObjectUtils.getItemValue(processedItem.item[name]) : void 0;
    },
    getPTOptions: function getPTOptions(key) {
      return this.ptm(key, {
        context: {
          item: this.item,
          index: this.index,
          focused: this.isItemFocused(),
          disabled: this.disabled()
        }
      });
    },
    isItemFocused: function isItemFocused() {
      return this.focusedOptionId === this.id;
    },
    onItemClick: function onItemClick(event) {
      var command = this.getItemProp(this.item, "command");
      command && command({
        originalEvent: event,
        item: this.item.item
      });
      this.$emit("item-click", {
        originalEvent: event,
        item: this.item,
        id: this.id
      });
    },
    visible: function visible() {
      return typeof this.item.visible === "function" ? this.item.visible() : this.item.visible !== false;
    },
    disabled: function disabled() {
      return typeof this.item.disabled === "function" ? this.item.disabled() : this.item.disabled;
    },
    label: function label() {
      return typeof this.item.label === "function" ? this.item.label() : this.item.label;
    },
    getMenuItemProps: function getMenuItemProps(item) {
      return {
        action: mergeProps({
          "class": this.cx("action"),
          tabindex: "-1",
          "aria-hidden": true
        }, this.getPTOptions("action")),
        icon: mergeProps({
          "class": [this.cx("icon"), item.icon]
        }, this.getPTOptions("icon")),
        label: mergeProps({
          "class": this.cx("label")
        }, this.getPTOptions("label"))
      };
    }
  },
  directives: {
    ripple: Ripple
  }
};
var _hoisted_1$1 = ["id", "aria-label", "aria-disabled", "data-p-focused", "data-p-disabled"];
var _hoisted_2$1 = ["href", "target"];
function render$1(_ctx, _cache, $props, $setup, $data, $options) {
  var _directive_ripple = resolveDirective("ripple");
  return $options.visible() ? (openBlock(), createElementBlock("li", mergeProps({
    key: 0,
    id: $props.id,
    "class": [_ctx.cx("menuitem"), $props.item["class"]],
    role: "menuitem",
    style: $props.item.style,
    "aria-label": $options.label(),
    "aria-disabled": $options.disabled()
  }, $options.getPTOptions("menuitem"), {
    "data-p-focused": $options.isItemFocused(),
    "data-p-disabled": $options.disabled() || false
  }), [createElementVNode("div", mergeProps({
    "class": _ctx.cx("content"),
    onClick: _cache[0] || (_cache[0] = function($event) {
      return $options.onItemClick($event);
    })
  }, $options.getPTOptions("content")), [!$props.templates.item ? withDirectives((openBlock(), createElementBlock("a", mergeProps({
    key: 0,
    href: $props.item.url,
    "class": _ctx.cx("action"),
    target: $props.item.target,
    tabindex: "-1",
    "aria-hidden": "true"
  }, $options.getPTOptions("action")), [$props.templates.itemicon ? (openBlock(), createBlock(resolveDynamicComponent($props.templates.itemicon), {
    key: 0,
    item: $props.item,
    "class": normalizeClass([_ctx.cx("icon"), $props.item.icon])
  }, null, 8, ["item", "class"])) : $props.item.icon ? (openBlock(), createElementBlock("span", mergeProps({
    key: 1,
    "class": [_ctx.cx("icon"), $props.item.icon]
  }, $options.getPTOptions("icon")), null, 16)) : createCommentVNode("", true), createElementVNode("span", mergeProps({
    "class": _ctx.cx("label")
  }, $options.getPTOptions("label")), toDisplayString($options.label()), 17)], 16, _hoisted_2$1)), [[_directive_ripple]]) : $props.templates.item ? (openBlock(), createBlock(resolveDynamicComponent($props.templates.item), {
    key: 1,
    item: $props.item,
    label: $options.label(),
    props: $options.getMenuItemProps($props.item)
  }, null, 8, ["item", "label", "props"])) : createCommentVNode("", true)], 16)], 16, _hoisted_1$1)) : createCommentVNode("", true);
}
script$1.render = render$1;
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null)
    return Array.from(iter);
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr))
    return _arrayLikeToArray(arr);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
var script = {
  name: "Menu",
  "extends": script$2,
  inheritAttrs: false,
  emits: ["show", "hide", "focus", "blur"],
  data: function data() {
    return {
      id: this.$attrs.id,
      overlayVisible: false,
      focused: false,
      focusedOptionIndex: -1,
      selectedOptionIndex: -1
    };
  },
  watch: {
    "$attrs.id": function $attrsId(newValue) {
      this.id = newValue || UniqueComponentId();
    }
  },
  target: null,
  outsideClickListener: null,
  scrollHandler: null,
  resizeListener: null,
  container: null,
  list: null,
  mounted: function mounted() {
    this.id = this.id || UniqueComponentId();
    if (!this.popup) {
      this.bindResizeListener();
      this.bindOutsideClickListener();
    }
  },
  beforeUnmount: function beforeUnmount() {
    this.unbindResizeListener();
    this.unbindOutsideClickListener();
    if (this.scrollHandler) {
      this.scrollHandler.destroy();
      this.scrollHandler = null;
    }
    this.target = null;
    if (this.container && this.autoZIndex) {
      ZIndexUtils.clear(this.container);
    }
    this.container = null;
  },
  methods: {
    itemClick: function itemClick(event) {
      var item = event.item;
      if (this.disabled(item)) {
        return;
      }
      if (item.command) {
        item.command(event);
      }
      if (this.overlayVisible)
        this.hide();
      if (!this.popup && this.focusedOptionIndex !== event.id) {
        this.focusedOptionIndex = event.id;
      }
    },
    onListFocus: function onListFocus(event) {
      this.focused = true;
      if (!this.popup) {
        if (this.selectedOptionIndex !== -1) {
          this.changeFocusedOptionIndex(this.selectedOptionIndex);
          this.selectedOptionIndex = -1;
        } else
          this.changeFocusedOptionIndex(0);
      }
      this.$emit("focus", event);
    },
    onListBlur: function onListBlur(event) {
      this.focused = false;
      this.focusedOptionIndex = -1;
      this.$emit("blur", event);
    },
    onListKeyDown: function onListKeyDown(event) {
      switch (event.code) {
        case "ArrowDown":
          this.onArrowDownKey(event);
          break;
        case "ArrowUp":
          this.onArrowUpKey(event);
          break;
        case "Home":
          this.onHomeKey(event);
          break;
        case "End":
          this.onEndKey(event);
          break;
        case "Enter":
        case "NumpadEnter":
          this.onEnterKey(event);
          break;
        case "Space":
          this.onSpaceKey(event);
          break;
        case "Escape":
          if (this.popup) {
            DomHandler.focus(this.target);
            this.hide();
          }
        case "Tab":
          this.overlayVisible && this.hide();
          break;
      }
    },
    onArrowDownKey: function onArrowDownKey(event) {
      var optionIndex = this.findNextOptionIndex(this.focusedOptionIndex);
      this.changeFocusedOptionIndex(optionIndex);
      event.preventDefault();
    },
    onArrowUpKey: function onArrowUpKey(event) {
      if (event.altKey && this.popup) {
        DomHandler.focus(this.target);
        this.hide();
        event.preventDefault();
      } else {
        var optionIndex = this.findPrevOptionIndex(this.focusedOptionIndex);
        this.changeFocusedOptionIndex(optionIndex);
        event.preventDefault();
      }
    },
    onHomeKey: function onHomeKey(event) {
      this.changeFocusedOptionIndex(0);
      event.preventDefault();
    },
    onEndKey: function onEndKey(event) {
      this.changeFocusedOptionIndex(DomHandler.find(this.container, 'li[data-pc-section="menuitem"][data-p-disabled="false"]').length - 1);
      event.preventDefault();
    },
    onEnterKey: function onEnterKey(event) {
      var element = DomHandler.findSingle(this.list, 'li[id="'.concat("".concat(this.focusedOptionIndex), '"]'));
      var anchorElement = element && DomHandler.findSingle(element, 'a[data-pc-section="action"]');
      this.popup && DomHandler.focus(this.target);
      anchorElement ? anchorElement.click() : element && element.click();
      event.preventDefault();
    },
    onSpaceKey: function onSpaceKey(event) {
      this.onEnterKey(event);
    },
    findNextOptionIndex: function findNextOptionIndex(index) {
      var links = DomHandler.find(this.container, 'li[data-pc-section="menuitem"][data-p-disabled="false"]');
      var matchedOptionIndex = _toConsumableArray(links).findIndex(function(link) {
        return link.id === index;
      });
      return matchedOptionIndex > -1 ? matchedOptionIndex + 1 : 0;
    },
    findPrevOptionIndex: function findPrevOptionIndex(index) {
      var links = DomHandler.find(this.container, 'li[data-pc-section="menuitem"][data-p-disabled="false"]');
      var matchedOptionIndex = _toConsumableArray(links).findIndex(function(link) {
        return link.id === index;
      });
      return matchedOptionIndex > -1 ? matchedOptionIndex - 1 : 0;
    },
    changeFocusedOptionIndex: function changeFocusedOptionIndex(index) {
      var links = DomHandler.find(this.container, 'li[data-pc-section="menuitem"][data-p-disabled="false"]');
      var order = index >= links.length ? links.length - 1 : index < 0 ? 0 : index;
      order > -1 && (this.focusedOptionIndex = links[order].getAttribute("id"));
    },
    toggle: function toggle(event) {
      if (this.overlayVisible)
        this.hide();
      else
        this.show(event);
    },
    show: function show(event) {
      this.overlayVisible = true;
      this.target = event.currentTarget;
    },
    hide: function hide() {
      this.overlayVisible = false;
      this.target = null;
    },
    onEnter: function onEnter(el) {
      DomHandler.addStyles(el, {
        position: "absolute",
        top: "0",
        left: "0"
      });
      this.alignOverlay();
      this.bindOutsideClickListener();
      this.bindResizeListener();
      this.bindScrollListener();
      if (this.autoZIndex) {
        ZIndexUtils.set("menu", el, this.baseZIndex + this.$primevue.config.zIndex.menu);
      }
      if (this.popup) {
        DomHandler.focus(this.list);
        this.changeFocusedOptionIndex(0);
      }
      this.$emit("show");
    },
    onLeave: function onLeave() {
      this.unbindOutsideClickListener();
      this.unbindResizeListener();
      this.unbindScrollListener();
      this.$emit("hide");
    },
    onAfterLeave: function onAfterLeave(el) {
      if (this.autoZIndex) {
        ZIndexUtils.clear(el);
      }
    },
    alignOverlay: function alignOverlay() {
      DomHandler.absolutePosition(this.container, this.target);
      var targetWidth = DomHandler.getOuterWidth(this.target);
      if (targetWidth > DomHandler.getOuterWidth(this.container)) {
        this.container.style.minWidth = DomHandler.getOuterWidth(this.target) + "px";
      }
    },
    bindOutsideClickListener: function bindOutsideClickListener() {
      var _this = this;
      if (!this.outsideClickListener) {
        this.outsideClickListener = function(event) {
          var isOutsideContainer = _this.container && !_this.container.contains(event.target);
          var isOutsideTarget = !(_this.target && (_this.target === event.target || _this.target.contains(event.target)));
          if (_this.overlayVisible && isOutsideContainer && isOutsideTarget) {
            _this.hide();
          } else if (!_this.popup && isOutsideContainer && isOutsideTarget) {
            _this.focusedOptionIndex = -1;
          }
        };
        (void 0).addEventListener("click", this.outsideClickListener);
      }
    },
    unbindOutsideClickListener: function unbindOutsideClickListener() {
      if (this.outsideClickListener) {
        (void 0).removeEventListener("click", this.outsideClickListener);
        this.outsideClickListener = null;
      }
    },
    bindScrollListener: function bindScrollListener() {
      var _this2 = this;
      if (!this.scrollHandler) {
        this.scrollHandler = new ConnectedOverlayScrollHandler(this.target, function() {
          if (_this2.overlayVisible) {
            _this2.hide();
          }
        });
      }
      this.scrollHandler.bindScrollListener();
    },
    unbindScrollListener: function unbindScrollListener() {
      if (this.scrollHandler) {
        this.scrollHandler.unbindScrollListener();
      }
    },
    bindResizeListener: function bindResizeListener() {
      var _this3 = this;
      if (!this.resizeListener) {
        this.resizeListener = function() {
          if (_this3.overlayVisible && !DomHandler.isTouchDevice()) {
            _this3.hide();
          }
        };
        (void 0).addEventListener("resize", this.resizeListener);
      }
    },
    unbindResizeListener: function unbindResizeListener() {
      if (this.resizeListener) {
        (void 0).removeEventListener("resize", this.resizeListener);
        this.resizeListener = null;
      }
    },
    visible: function visible2(item) {
      return typeof item.visible === "function" ? item.visible() : item.visible !== false;
    },
    disabled: function disabled2(item) {
      return typeof item.disabled === "function" ? item.disabled() : item.disabled;
    },
    label: function label2(item) {
      return typeof item.label === "function" ? item.label() : item.label;
    },
    onOverlayClick: function onOverlayClick(event) {
      OverlayEventBus.emit("overlay-click", {
        originalEvent: event,
        target: this.target
      });
    },
    containerRef: function containerRef(el) {
      this.container = el;
    },
    listRef: function listRef(el) {
      this.list = el;
    }
  },
  computed: {
    focusedOptionId: function focusedOptionId() {
      return this.focusedOptionIndex !== -1 ? this.focusedOptionIndex : null;
    }
  },
  components: {
    PVMenuitem: script$1,
    Portal: script$3
  }
};
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
var _hoisted_1 = ["id"];
var _hoisted_2 = ["id", "tabindex", "aria-activedescendant", "aria-label", "aria-labelledby"];
var _hoisted_3 = ["id"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  var _component_PVMenuitem = resolveComponent("PVMenuitem");
  var _component_Portal = resolveComponent("Portal");
  return openBlock(), createBlock(_component_Portal, {
    appendTo: _ctx.appendTo,
    disabled: !_ctx.popup
  }, {
    "default": withCtx(function() {
      return [createVNode(Transition, mergeProps({
        name: "p-connected-overlay",
        onEnter: $options.onEnter,
        onLeave: $options.onLeave,
        onAfterLeave: $options.onAfterLeave
      }, _ctx.ptm("transition")), {
        "default": withCtx(function() {
          return [(_ctx.popup ? $data.overlayVisible : true) ? (openBlock(), createElementBlock("div", mergeProps({
            key: 0,
            ref: $options.containerRef,
            id: $data.id,
            "class": _ctx.cx("root"),
            onClick: _cache[3] || (_cache[3] = function() {
              return $options.onOverlayClick && $options.onOverlayClick.apply($options, arguments);
            })
          }, _objectSpread(_objectSpread({}, _ctx.$attrs), _ctx.ptm("root"))), [_ctx.$slots.start ? (openBlock(), createElementBlock("div", mergeProps({
            key: 0,
            "class": _ctx.cx("start")
          }, _ctx.ptm("start")), [renderSlot(_ctx.$slots, "start")], 16)) : createCommentVNode("", true), createElementVNode("ul", mergeProps({
            ref: $options.listRef,
            id: $data.id + "_list",
            "class": _ctx.cx("menu"),
            role: "menu",
            tabindex: _ctx.tabindex,
            "aria-activedescendant": $data.focused ? $options.focusedOptionId : void 0,
            "aria-label": _ctx.ariaLabel,
            "aria-labelledby": _ctx.ariaLabelledby,
            onFocus: _cache[0] || (_cache[0] = function() {
              return $options.onListFocus && $options.onListFocus.apply($options, arguments);
            }),
            onBlur: _cache[1] || (_cache[1] = function() {
              return $options.onListBlur && $options.onListBlur.apply($options, arguments);
            }),
            onKeydown: _cache[2] || (_cache[2] = function() {
              return $options.onListKeyDown && $options.onListKeyDown.apply($options, arguments);
            })
          }, _ctx.ptm("menu")), [(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.model, function(item, i) {
            return openBlock(), createElementBlock(Fragment, {
              key: $options.label(item) + i.toString()
            }, [item.items && $options.visible(item) && !item.separator ? (openBlock(), createElementBlock(Fragment, {
              key: 0
            }, [item.items ? (openBlock(), createElementBlock("li", mergeProps({
              key: 0,
              id: $data.id + "_" + i,
              "class": [_ctx.cx("submenuHeader"), item["class"]],
              role: "none"
            }, _ctx.ptm("submenuHeader")), [renderSlot(_ctx.$slots, "submenuheader", {
              item
            }, function() {
              return [createTextVNode(toDisplayString($options.label(item)), 1)];
            })], 16, _hoisted_3)) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(item.items, function(child, j) {
              return openBlock(), createElementBlock(Fragment, {
                key: child.label + i + "_" + j
              }, [$options.visible(child) && !child.separator ? (openBlock(), createBlock(_component_PVMenuitem, {
                key: 0,
                id: $data.id + "_" + i + "_" + j,
                item: child,
                templates: _ctx.$slots,
                focusedOptionId: $options.focusedOptionId,
                onItemClick: $options.itemClick,
                pt: _ctx.pt
              }, null, 8, ["id", "item", "templates", "focusedOptionId", "onItemClick", "pt"])) : $options.visible(child) && child.separator ? (openBlock(), createElementBlock("li", mergeProps({
                key: "separator" + i + j,
                "class": [_ctx.cx("separator"), item["class"]],
                style: child.style,
                role: "separator"
              }, _ctx.ptm("separator")), null, 16)) : createCommentVNode("", true)], 64);
            }), 128))], 64)) : $options.visible(item) && item.separator ? (openBlock(), createElementBlock("li", mergeProps({
              key: "separator" + i.toString(),
              "class": [_ctx.cx("separator"), item["class"]],
              style: item.style,
              role: "separator"
            }, _ctx.ptm("separator")), null, 16)) : (openBlock(), createBlock(_component_PVMenuitem, {
              key: $options.label(item) + i.toString(),
              id: $data.id + "_" + i,
              item,
              index: i,
              templates: _ctx.$slots,
              focusedOptionId: $options.focusedOptionId,
              onItemClick: $options.itemClick,
              pt: _ctx.pt
            }, null, 8, ["id", "item", "index", "templates", "focusedOptionId", "onItemClick", "pt"]))], 64);
          }), 128))], 16, _hoisted_2), _ctx.$slots.end ? (openBlock(), createElementBlock("div", mergeProps({
            key: 1,
            "class": _ctx.cx("end")
          }, _ctx.ptm("end")), [renderSlot(_ctx.$slots, "end")], 16)) : createCommentVNode("", true)], 16, _hoisted_1)) : createCommentVNode("", true)];
        }),
        _: 3
      }, 16, ["onEnter", "onLeave", "onAfterLeave"])];
    }),
    _: 3
  }, 8, ["appendTo", "disabled"]);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=menu.esm-nfqGfx2z.js.map
