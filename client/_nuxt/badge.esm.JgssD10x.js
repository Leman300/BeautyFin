import{N as n,O as r,v as o,x as p,Y as i,C as d,z as l,T as g}from"./entry.Oqbc3ytE.js";import{s as c}from"./basecomponent.esm.t8RrtfK_.js";var u={root:function(a){var e=a.props,s=a.instance;return["p-badge p-component",{"p-badge-no-gutter":r.isNotEmpty(e.value)&&String(e.value).length===1,"p-badge-dot":r.isEmpty(e.value)&&!s.$slots.default,"p-badge-lg":e.size==="large","p-badge-xl":e.size==="xlarge","p-badge-info":e.severity==="info","p-badge-success":e.severity==="success","p-badge-warning":e.severity==="warning","p-badge-danger":e.severity==="danger","p-badge-secondary":e.severity==="secondary","p-badge-contrast":e.severity==="contrast"}]}},v=n.extend({name:"badge",classes:u}),y={name:"BaseBadge",extends:c,props:{value:{type:[String,Number],default:null},severity:{type:String,default:null},size:{type:String,default:null}},style:v,provide:function(){return{$parentInstance:this}}},b={name:"Badge",extends:y};function m(t,a,e,s,f,$){return o(),p("span",g({class:t.cx("root")},t.ptm("root")),[i(t.$slots,"default",{},function(){return[d(l(t.value),1)]})],16)}b.render=m;export{b as default};
