var gestionMenu=function(){this.pestanaActiva="";return{setActionOneTabPage:function(a,b){var c=document.createElement("form");c.method="post";document.body.appendChild(c);this.setElement(c,"input","tabid",a.id);c.action=b;c.submit()},setElement:function(d,a,b,e){var c=document.createElement(a);c.name=b;c.id=b;c.setAttribute("type","hidden");c.value=e;d.appendChild(c)}}}();