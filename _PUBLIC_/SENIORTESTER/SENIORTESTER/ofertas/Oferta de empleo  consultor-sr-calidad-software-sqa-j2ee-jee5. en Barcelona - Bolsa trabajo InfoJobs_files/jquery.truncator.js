(function(g){var h=true;g.fn.truncate=function(i){var j=g.extend({},g.fn.truncate.defaults,i);g(this).each(function(){var m=g.trim(a(g(this).text())).length;if(m<=j.max_length){return}var n=j.max_length-j.more.length-1;var l=e(this,n);var k=g(this).hide();l.insertAfter(k);c(l).append(' <a href="#show more content">'+j.more+"</a>");b(k).append(' <a href="#show less content">'+j.less+"</a>");l.find("a:last").click(function(){l.hide();k.show();return false});k.find("a:last").click(function(){l.show();k.hide();return false})})};g.fn.truncate.defaults={max_length:100,more:"…more",less:"less"};function e(i,j){return(i.nodeType==3)?f(i,j):d(i,j)}function d(i,l){var i=g(i);var k=i.clone().empty();var j;i.contents().each(function(){var m=l-k.text().length;if(m==0){return}j=e(this,m);if(j){k.append(j)}});return k}function f(i,k){var j=a(i.data);if(h){j=j.replace(/^ /,"")}h=!!j.match(/ $/);var j=j.slice(0,k);j=g("<div/>").text(j).html();return j}function a(i){return i.replace(/\s+/g," ")}function c(k){var i=g(k);var j=i.children(":last");if(!j){return k}var l=j.css("display");if(!l||l=="inline"){return i}return c(j)}function b(k){var i=g(k);var j=i.children(":last");if(j&&j.is("p")){return j}return k}})(jQuery);