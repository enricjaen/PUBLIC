function continueSaveSearchThickBox(){document.getElementById("form_relaunch").submit();document.getElementById("form_relaunch").target="_self"}function restoreFormRelaunch(b,a){document.getElementById("form_relaunch").target="_self";if(a!=null){document.getElementById("form_relaunch").action=a}else{document.getElementById("form_relaunch").action="#"}if(b!=null){document.getElementById("form_relaunch").query_id.value=b}}function saveQuery(e,b,a,c,d){entrarThickBox("","/candidate/candidate_save_search_thickbox.xhtml?dgv="+getDgv()+"&query_id="+e+"&oferta_codigo="+b+"&push="+a,"720","auto",{setAutoScrolling:true},".check-rad #chkPush");setExclusiveOnCloseThickBoxEvent(reLoadPageEvent);if(c){return jsXiti.incXitiCounterNavigationLink(this,d,c)}return true}function reLoadPageEvent(){if(flagThick!=null&&flagThick){window.location=document.location.href}}function executeLoginWithSearch(c,e,b,f){var a="/jobsearch/search-results/list.xhtml";if(b!=null){a+="?id="+b;a+="&openTbMode="+c}var d=escape(a);abrirThickboxLogin(d,false);if(e){return jsXiti.incXitiCounterAction(this,f,e)}}function executeLoginWithOffer(d,f,a,c,g){var b="/ver-oferta.xhtml";if(c!=null){b+="?of_codigo="+a;b+="&id="+c;b+="&openTbMode="+d}var e=escape(b);abrirThickboxLogin(e,false);if(f){return jsXiti.incXitiCounterAction(this,g,f)}};