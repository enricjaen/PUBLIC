var Ajaxpect={addBefore:function(d,a,c){var b=function(e){return function(){return e.apply(this,c(arguments,e,this))}};this._process(d,a,b)},addAfter:function(c,a,d){var b=function(e){return function(){return d(e.apply(this,arguments),arguments,e,this)}};this._process(c,a,b)},addAround:function(d,a,c){var b=function(e){return function(){return c(arguments,e,this)}};this._process(d,a,b)},_process:function(d,b,c){var a;if(b.exec){a=function(f){return b.exec(f)}}else{if(b.call){a=function(f){return b.call(this,f)}}}if(a){for(var e in d){if(a(e)){this._attach(d,e,c)}}}else{this._attach(d,b,c)}},_attach:function(b,d,a){var c=b[d];b[d]=a(c)}};