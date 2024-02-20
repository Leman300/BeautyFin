import{s as I}from"./index.esm.MKir4ovT.js";import{s as P}from"./index.esm.n5PUT4xd.js";import{N as x,U as m,T as d,P as l,R as w,v as s,x as h,W as E,X as H,y as T,J as p,_ as b,z as K,V as v,A as S,B as C,a2 as D,a3 as k,a0 as O}from"./entry.Oqbc3ytE.js";import{s as N}from"./basecomponent.esm.t8RrtfK_.js";import"./baseicon.esm.TDgYDSCe.js";var j={root:"p-accordion p-component",tab:{root:function(e){var a=e.instance,n=e.index;return["p-accordion-tab",{"p-accordion-tab-active":a.isTabActive(n)}]},header:function(e){var a=e.instance,n=e.tab,c=e.index;return["p-accordion-header",{"p-highlight":a.isTabActive(c),"p-disabled":a.getTabProp(n,"disabled")}]},headerAction:"p-accordion-header-link p-accordion-header-action",headerIcon:"p-accordion-toggle-icon",headerTitle:"p-accordion-header-text",toggleableContent:"p-toggleable-content",content:"p-accordion-content"}},F=x.extend({name:"accordion",classes:j}),_={name:"BaseAccordion",extends:N,props:{multiple:{type:Boolean,default:!1},activeIndex:{type:[Number,Array],default:null},lazy:{type:Boolean,default:!1},expandIcon:{type:String,default:void 0},collapseIcon:{type:String,default:void 0},tabindex:{type:Number,default:0},selectOnFocus:{type:Boolean,default:!1}},style:F,provide:function(){return{$parentInstance:this}}},B={name:"Accordion",extends:_,emits:["update:activeIndex","tab-open","tab-close","tab-click"],data:function(){return{id:this.$attrs.id,d_activeIndex:this.activeIndex}},watch:{"$attrs.id":function(e){this.id=e||m()},activeIndex:function(e){this.d_activeIndex=e}},mounted:function(){this.id=this.id||m()},methods:{isAccordionTab:function(e){return e.type.name==="AccordionTab"},isTabActive:function(e){return this.multiple?this.d_activeIndex&&this.d_activeIndex.includes(e):this.d_activeIndex===e},getTabProp:function(e,a){return e.props?e.props[a]:void 0},getKey:function(e,a){return this.getTabProp(e,"header")||a},getTabHeaderActionId:function(e){return"".concat(this.id,"_").concat(e,"_header_action")},getTabContentId:function(e){return"".concat(this.id,"_").concat(e,"_content")},getTabPT:function(e,a,n){var c=this.tabs.length,r={props:e.props||{},parent:{instance:this,props:this.$props,state:this.$data},context:{index:n,count:c,first:n===0,last:n===c-1,active:this.isTabActive(n)}};return d(this.ptm("tab.".concat(a),{tab:r}),this.ptm("accordiontab.".concat(a),{accordiontab:r}),this.ptm("accordiontab.".concat(a),r),this.ptmo(this.getTabProp(e,"pt"),a,r))},onTabClick:function(e,a,n){this.changeActiveIndex(e,a,n),this.$emit("tab-click",{originalEvent:e,index:n})},onTabKeyDown:function(e,a,n){switch(e.code){case"ArrowDown":this.onTabArrowDownKey(e);break;case"ArrowUp":this.onTabArrowUpKey(e);break;case"Home":this.onTabHomeKey(e);break;case"End":this.onTabEndKey(e);break;case"Enter":case"NumpadEnter":case"Space":this.onTabEnterKey(e,a,n);break}},onTabArrowDownKey:function(e){var a=this.findNextHeaderAction(e.target.parentElement.parentElement);a?this.changeFocusedTab(e,a):this.onTabHomeKey(e),e.preventDefault()},onTabArrowUpKey:function(e){var a=this.findPrevHeaderAction(e.target.parentElement.parentElement);a?this.changeFocusedTab(e,a):this.onTabEndKey(e),e.preventDefault()},onTabHomeKey:function(e){var a=this.findFirstHeaderAction();this.changeFocusedTab(e,a),e.preventDefault()},onTabEndKey:function(e){var a=this.findLastHeaderAction();this.changeFocusedTab(e,a),e.preventDefault()},onTabEnterKey:function(e,a,n){this.changeActiveIndex(e,a,n),e.preventDefault()},findNextHeaderAction:function(e){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1,n=a?e:e.nextElementSibling,c=l.findSingle(n,'[data-pc-section="header"]');return c?l.getAttribute(c,"data-p-disabled")?this.findNextHeaderAction(c.parentElement):l.findSingle(c,'[data-pc-section="headeraction"]'):null},findPrevHeaderAction:function(e){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1,n=a?e:e.previousElementSibling,c=l.findSingle(n,'[data-pc-section="header"]');return c?l.getAttribute(c,"data-p-disabled")?this.findPrevHeaderAction(c.parentElement):l.findSingle(c,'[data-pc-section="headeraction"]'):null},findFirstHeaderAction:function(){return this.findNextHeaderAction(this.$el.firstElementChild,!0)},findLastHeaderAction:function(){return this.findPrevHeaderAction(this.$el.lastElementChild,!0)},changeActiveIndex:function(e,a,n){if(!this.getTabProp(a,"disabled")){var c=this.isTabActive(n),r=c?"tab-close":"tab-open";this.multiple?c?this.d_activeIndex=this.d_activeIndex.filter(function(i){return i!==n}):this.d_activeIndex?this.d_activeIndex.push(n):this.d_activeIndex=[n]:this.d_activeIndex=this.d_activeIndex===n?null:n,this.$emit("update:activeIndex",this.d_activeIndex),this.$emit(r,{originalEvent:e,index:n})}},changeFocusedTab:function(e,a){if(a&&(l.focus(a),this.selectOnFocus)){var n=parseInt(a.parentElement.parentElement.dataset.pcIndex,10),c=this.tabs[n];this.changeActiveIndex(e,c,n)}}},computed:{tabs:function(){var e=this;return this.$slots.default().reduce(function(a,n){return e.isAccordionTab(n)?a.push(n):n.children&&n.children instanceof Array&&n.children.forEach(function(c){e.isAccordionTab(c)&&a.push(c)}),a},[])}},components:{ChevronDownIcon:I,ChevronRightIcon:P},directives:{ripple:w}};function f(t){"@babel/helpers - typeof";return f=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},f(t)}function y(t,e){var a=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter(function(c){return Object.getOwnPropertyDescriptor(t,c).enumerable})),a.push.apply(a,n)}return a}function u(t){for(var e=1;e<arguments.length;e++){var a=arguments[e]!=null?arguments[e]:{};e%2?y(Object(a),!0).forEach(function(n){U(t,n,a[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(a)):y(Object(a)).forEach(function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(a,n))})}return t}function U(t,e,a){return e=z(e),e in t?Object.defineProperty(t,e,{value:a,enumerable:!0,configurable:!0,writable:!0}):t[e]=a,t}function z(t){var e=L(t,"string");return f(e)=="symbol"?e:String(e)}function L(t,e){if(f(t)!="object"||!t)return t;var a=t[Symbol.toPrimitive];if(a!==void 0){var n=a.call(t,e||"default");if(f(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var R=["data-pc-index","data-p-active"],V=["data-p-highlight","data-p-disabled"],q=["id","tabindex","aria-disabled","aria-expanded","aria-controls","onClick","onKeydown"],J=["id","aria-labelledby"];function M(t,e,a,n,c,r){return s(),h("div",d({class:t.cx("root")},t.ptm("root")),[(s(!0),h(E,null,H(r.tabs,function(i,o){return s(),h("div",d({key:r.getKey(i,o),class:t.cx("tab.root",{tab:i,index:o})},r.getTabPT(i,"root",o),{"data-pc-name":"accordiontab","data-pc-index":o,"data-p-active":r.isTabActive(o)}),[T("div",d({style:r.getTabProp(i,"headerStyle"),class:[t.cx("tab.header",{tab:i,index:o}),r.getTabProp(i,"headerClass")]},u(u({},r.getTabProp(i,"headerProps")),r.getTabPT(i,"header",o)),{"data-p-highlight":r.isTabActive(o),"data-p-disabled":r.getTabProp(i,"disabled")}),[T("a",d({id:r.getTabHeaderActionId(o),class:t.cx("tab.headerAction"),tabindex:r.getTabProp(i,"disabled")?-1:t.tabindex,role:"button","aria-disabled":r.getTabProp(i,"disabled"),"aria-expanded":r.isTabActive(o),"aria-controls":r.getTabContentId(o),onClick:function(g){return r.onTabClick(g,i,o)},onKeydown:function(g){return r.onTabKeyDown(g,i,o)}},u(u({},r.getTabProp(i,"headeractionprops")),r.getTabPT(i,"headeraction",o))),[i.children&&i.children.headericon?(s(),p(b(i.children.headericon),{key:0,isTabActive:r.isTabActive(o),active:r.isTabActive(o),index:o},null,8,["isTabActive","active","index"])):r.isTabActive(o)?(s(),p(b(t.$slots.collapseicon?t.$slots.collapseicon:t.collapseIcon?"span":"ChevronDownIcon"),d({key:1,class:[t.cx("tab.headerIcon"),t.collapseIcon],"aria-hidden":"true"},r.getTabPT(i,"headericon",o)),null,16,["class"])):(s(),p(b(t.$slots.expandicon?t.$slots.expandicon:t.expandIcon?"span":"ChevronRightIcon"),d({key:2,class:[t.cx("tab.headerIcon"),t.expandIcon],"aria-hidden":"true"},r.getTabPT(i,"headericon",o)),null,16,["class"])),i.props&&i.props.header?(s(),h("span",d({key:3,class:t.cx("tab.headerTitle")},r.getTabPT(i,"headertitle",o)),K(i.props.header),17)):v("",!0),i.children&&i.children.header?(s(),p(b(i.children.header),{key:4})):v("",!0)],16,q)],16,V),S(O,d({name:"p-toggleable-content"},r.getTabPT(i,"transition",o)),{default:C(function(){return[!t.lazy||r.isTabActive(o)?D((s(),h("div",d({key:0,id:r.getTabContentId(o),style:r.getTabProp(i,"contentStyle"),class:[t.cx("tab.toggleableContent"),r.getTabProp(i,"contentClass")],role:"region","aria-labelledby":r.getTabHeaderActionId(o)},u(u({},r.getTabProp(i,"contentProps")),r.getTabPT(i,"toggleablecontent",o))),[T("div",d({class:t.cx("tab.content")},r.getTabPT(i,"content",o)),[(s(),p(b(i)))],16)],16,J)),[[k,t.lazy?!0:r.isTabActive(o)]]):v("",!0)]}),_:2},1040)],16,R)}),128))],16)}B.render=M;export{B as default};
