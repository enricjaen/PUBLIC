function validarInternal(b){resetAlertaError();var a=false;var c=document.getElementById(b);trim(c.email);trim(c.password);a|=!longitud(c.email,getIJMessage("Email"),1,100);a|=!longitud(c.password,getIJMessage("Contrasenya"),1,20);if(a){return false}createTestCookieLogin();return true}function validarLogin(a){return validarInternal(a)}function createTestCookieLogin(){var b=new Date();b.setTime(b.getTime()+120*1000);var a=window.location.hostname.replace("www","");var c="/";SetCookie("test-cookie","to be or not to be",b,c,a);return true}function recordarCandidatoPassword(a){window.open(a,"","toolbar=no,location=no,directories=no,status=no,menubar=no,width=512,height=518,top=50,left=50,scrollbars=no");return false}function recordarEmpleadoPassword(){window.open("/employer/lost-password/confirm.xhtml","","toolbar=no,location=no,directories=no,status=no,menubar=no,width=441,height=475,top=50,left=50,scrollbars=no");return false}function contadorXitic(b,c,a){return xt_click(b,"C",c,a,"A")}$(window).load(function(){infojobs.banner.hideEmptyBannerContainer("bigBanner","promo")});