function isCandidate(){var a=getCookieValue("IJUSERNL");if(null!=a){var b=a.split("�");if(null!=b&&b.length>=3&&b[1]=="CA"){return true}}return false}function isEmployer(){var a=getCookieValue("IJUSERNL");if(null!=a){var b=a.split("�");if(null!=b&&b.length>=3&&b[1]=="EM"){return true}}return false}function getUser(){var b=getCookieValue("IJUSERNL");var a=b.split("�");if(null!=a&&a.length>1){return a[0]}return""}function getCandidate(){if(isCandidate()){return trataText(XSSEncode(getUser()))}return""}function getEmployer(){if(isEmployer()){return trataText(XSSEncode(getUser()))}return""}function deleteCookieUser(){var a=document.domain;a=a.replace("www","");if(a.indexOf(".asp.")!=-1){a=a.split("asp","2");a=a[1]}if(a.indexOf("sandbox.")!=-1){a=a.split("sandbox","2");a=a[1];alert(a)}expireCookie("IJUSERNL","/",a);expireCookie("IJUOV","/",a);expireCookie("IJUOV","/","www"+a);var c=document.location.href.split("#",1);var b=c[0];if(b.indexOf("employer-login-run.xhtml")>0){b=b.replace("employer-login-run.xhtml","employer-login.xhtml")}if(b.indexOf("dgv=")>0){b=b.replace("dgv=","dgv=1")}else{b=encodeURL(b)}window.location=b}function XSSEncode(a){if(null!=a&&a.length>1){a=a.replace(/\'/g,"&#39;");a=a.replace(/\"/g,"&quot;");a=a.replace(/</g,"&lt;");a=a.replace(/>/g,"&gt;");return a}else{return""}}function trataText(a){if(null!=a&&a.length>1){a=replaceAll(a,"+"," ");return a}else{return""}}function replaceAll(c,b,a){while(c.indexOf(b)!=-1){c=c.replace(b,a)}return c};