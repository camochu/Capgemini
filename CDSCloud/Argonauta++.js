// ==UserScript==
// @name        Argonauta++
// @description Remedy UI modification
// @copyright   2020, Raúl Díez Martín. Fork: Miguel A. Pardo
// @icon        https://itsmte.tor.telefonica.es/arsys/resources/images/favicon.ico
// @match       https://itsmte.tor.telefonica.es/arsys/forms/onbmc-s/SHR%3ALandingConsole/Default+Administrator+View/*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require     http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.1/jquery-ui.min.js
// @grant       GM_addStyle
// @version     0.3.3
// ==/UserScript==

// Novedades 0.3.3:
//   - ctrl-alt-h Inserta ayuda en lugar de ctrl-alt-0
//   - ctrl-alt-0 captura portapapeles y guarda para insertarlo con ctrl-alt-9
//   - ctrl-alt-v inserta ciclicamente los tags de vithas en campo notas
// Novedades 0.3.2:
//   - Deficición de textos modelo para agregar notas con ctrl-alt-[1..9]
// Novedades 0.3.0:
//   - Se permite ctrl-alt-D (mayuscula) ademas de minuscula para diagnosticar
//   - Se copia categorizacion de resolución para diagnostico con ctr-alt-d
//     (pero es necesario hacer doble clic en las dos ultimas casillas para que guarde)

// Declaración de variables
var myUser = "";
var myINC = "";
var myResumen = "";
var myGrupoAsignado = "";
var myUsuarioAsignado = "";
var myEstado = "";
var myComentario = "";
var myRegistro = "";
var myDate = new Date();
var myDateStr = myDate.toLocaleDateString('es-UK');
var myCurrentView = "";
var myHelp = ""; // Texto de ayuda para mostrarlo con ctrl-alt-h
var myNote = [["Pendiente","*/Pendiente  de Usuario/Cliente (Pdte. Accion requerida Usuario/Cliente afectado)/*"],
              ["Alta correo 1/2","Se crea buzón remoto. A la espera de sincronización con O365"],
              ["Alta correo 2/2","Se crea correo en o365 y se asigna licencia"],
              ["Baja correo pdte.","Se cambia licencia a E3 y se habilita suspensión por litigio.\nA las espera de 24h para desactivar licencia"],
              ["Contacta tu si quies...","SDNIVEL1 no contacta con cliente. El contacto debe realizarlo el propio grupo que necesite o facilite información"],
              ["Nada de momento",""],
              ["Nada de momento",""],
              ["Nada de momento",""],
              ["Inserta nota personalizada",""],
              ["Modificar nota personalizada (captura portapapeles)",""]
             ];
// Se construye y se guarda el texto de ayuda
myHelp = "Inserción de diagnostico\n";
myHelp += "  Ctrl-Alt-d   \n\n";
myHelp += "Inserción de notas (usar teclado numérico)\n";
for(var i=1; i<myNote.length ; i++) {
    // se van agregando las notas
    myHelp += "  Ctrl-Alt-" + i + "   " + myNote[i-1][0] + "\n";
}
myHelp += "  Ctrl-Alt-0   " + myNote[myNote.length-1][0] + "\n\n";
myHelp += "Inserción de TAGs de Vithas\n";
myHelp += "  Ctrl-Alt-v   Insertar cíclicamente los TAGs";

var vithasNote = ["*/AINCORRECTA/*", "*/NOGESTIONADO/*", "*/CHECK/*"];
var currentVithasNote = 0;

// Elementos visuales
var myButton = document.createElement("Button");

// Botón para copiar los detalles de la incidencia actual
myButton.innerHTML = " < Vacío > ";
myButton.style = "font-size: 15px; bottom: 15px; left: 15px; position: fixed; z-index: 99999; padding: 5px; background-color: rgb(239, 239, 239)";
document.body.appendChild(myButton);

// Se da funcionalidad al pulsar el botón
myButton.onclick = copyINC;

// Se detectan pulsaciones de teclas y se actúa en consecuencia
document.addEventListener('keydown', function(event) {
    // Se detecta cuándo se guarda el ticket mediante "CTRL + ALT + ENTER" para copiar los detalles del ticket al portapapeles
    if (event.ctrlKey && event.altKey && event.key === 'Enter') {
        copyINC();
    }
   // Se detecta cuándo se pulsa "CTRL + ALT + h" para mostrar ayuda
    else if (event.ctrlKey && event.altKey && (event.key === 'h' || event.key === 'H')) {
        window.alert(myHelp);
    }
   // Se detecta cuándo se pulsa "CTRL + ALT + v" para insertar TAGs de vithas
    else if (event.ctrlKey && event.altKey && (event.key === 'v' || event.key === 'V')) {
        // se rellena nota de vithas secuencialmente
        if (currentVithasNote == vithasNote.length) currentVithasNote = 0;
        console.log('Detectada combinación de teclas para notas de Vithas.'+currentVithasNote);
        $("[id*='304247080']").focus().val('').val(vithasNote[currentVithasNote++]);
    }
    // Se detecta cuándo se pulsa "CTRL + ALT + d"
    else if (event.ctrlKey && event.altKey && (event.key === 'd' || event.key === 'D')) {
        // se genera nota */DIAGNOSTICO+resumen/* si estoy en la pestaña detalles de trabajo
        if ($("[id*='301626100']")[0].style.visibility ==='inherit') {
            getResumen();
            myResumen = '*/DIAGNOSTICO: ' + myResumen + '/*'
            $("[id*='304247080']").focus().val('').val(myResumen);
        }
        // se rellena categorizacion de resolución si estoy en la pestaña categorizacion
        else if (($("[id*='304287750']")[0].style.visibility ==='inherit') &&($("[id*='304287650']")[0].style.visibility ==='inherit')) {
            var myCRN1 = "TI CLIENTES";
            var myCRN2 = "Motivo de Diagnóstico";
            var myCRN3 = "Análisis y diagnóstico por parte del técnico";
            $("[id*='1000002488']").focus().val('').val(myCRN1);
            $("[id*='1000003889']").focus().val('').val(myCRN2);
            $("[id*='1000003890']").focus().val('').val(myCRN3);
            $("[id*='1000002488']").focus();
        }
    }
    // Se detecta cuándo se pulsa Ctrl-Alt-[0..9] en la pestaña detalles de trabajo
    else if (event.ctrlKey && event.altKey && (event.key >= '0' && event.key <= '9') && $("[id*='301626100']")[0].style.visibility ==='inherit') {
          // se crea nota personalizada si ctrl-alt-0
          if(event.key === '0') {
              navigator.clipboard.readText().then(
                  clipText => myNote[8][1] = clipText);
          }
          // se inserta nota si ctrl-alt-[1..0]
          else
            $("[id*='304247080']").focus().val('').val(myNote[parseInt(event.key)-1][1]);
    }
});

setInterval(function() {
    if ($("#label80137").text() != "Página de Inicio de TI" && $("[id*='1000000099']").last().val() == "Incidencia") {
            myButton.style = "font-size: 15px; bottom: 15px; left: 15px; position: fixed; z-index: 99999; padding: 5px; background-color: rgb(255, 128, 128)"; // Anaranjado
            myButton.innerHTML = "Copiar INC 📋";
    }
    else if ($("#label80137").text() != "Página de Inicio de TI") {
        myButton.style = "font-size: 15px; bottom: 15px; left: 15px; position: fixed; z-index: 99999; padding: 5px; background-color: rgb(239, 239, 239)"; // Gris
        myButton.innerHTML = "Copiar 📋";
//        console.log('No incidencia' + $("[id*='1000000099']").last().val());
    }
    else {
        myButton.style = "font-size: 15px; bottom: 15px; left: 15px; position: fixed; z-index: 99999; padding: 5px; background-color: rgb(239, 239, 239)"; // Gris
        myButton.innerHTML = " < Vacío > ";
    }
}, 8000);

////////////////////////////
///       FUNCIONES      ///
////////////////////////////

function copyINC(){

    // Examina la vista actual
    getCurrentView();
    if (myCurrentView == "Página de Inicio de TI"){
        alert("No estás visualizando ninguna incidencia");
    } else {
        // Se seleccionan los valores de los campos
        cleanMyVariables();
        getLoggedUser();
        getINC();
        getResumen();
        getGrupoAsignado();
        getUsuarioAsignado();
        getEstado();

        // Se construye el registro a copiar
        var myRegistro = [myUser, myDateStr, myINC, myResumen, myGrupoAsignado, myEstado, myComentario];
        console.log (myRegistro);

        // Se aplica el estilo "Copiado" al botón
        var self = $(this);
        if (!self.data('add')) {
            self.data('add', true);
            self.text('Copiada ✔️');
            self.css('background-color','#b8ffcb'); // Verde claro

            // Se coloca el registro en el portapapeles
            var dummy = $('<input>').val(myRegistro).appendTo('body').select()
            document.execCommand('copy')

            // Se aplica el estilo "Listo para copiar" al botón
            setTimeout(function() {
                if ($("[id*='1000000099']").last().val() == "Incidencia") {
                    self.text('Copiar INC 📋').data('add', false);
                    self.css('background-color','#ef8080'); // Anaranjado
                }
                else {
                    self.text('Copiar 📋').data('add', false);
                    self.css('background-color','#efefef'); // Gris estándar
                }
            }, 3000);
        }
    }
};

function cleanMyVariables(){
    myUser            = undefined;
    myINC             = undefined;
    myResumen         = undefined;
    myGrupoAsignado   = undefined;
    myUsuarioAsignado = undefined;
    myEstado          = undefined;
    myComentario      = undefined;
    myRegistro        = undefined;
}

function getLoggedUser(){
    myUser = $("#label301354000").text();
    console.log ("Usuario Actual: " + myUser);
}

function getCurrentView() {
    myCurrentView = $("#label80137").text();
    console.log ("Vista Actual: " + myCurrentView);
}

function getINC() {
    myINC = $("[id*='1000000161']").last().val();
    console.log ("Incidencia: " + myINC);
}

function getResumen() {
    myResumen = $("[id*='1000000000']").last().val();
    myResumen = myResumen.replace(/,/g, ";");
    myResumen = myResumen.replace(/\t/g, ' ');
    console.log ("Resumen: " + myResumen);
}

function getGrupoAsignado() {
    myGrupoAsignado = $("[id*='1000000217']").last().val();
    console.log ("Grupo Asignado: " + myGrupoAsignado);
}

function getUsuarioAsignado() {
    myUsuarioAsignado = $("[id*='1000000218']").last().val();
    if (myUsuarioAsignado == "") {
        myComentario = undefined;
    } else {
        myComentario = "Usuario Asignado: " + myUsuarioAsignado;
    }
    console.log (myComentario);
}

function getEstado() {
    myEstado = $("[id ^='arid_WIN_'][id $='_7']").last().val();
    if (myEstado == "Asignado") {
        myEstado = "Escalado";
    }
    console.log ("Estado: " + myEstado);
}

function waitForKeyElements (
selectorTxt,     /* Required: The jQuery selector string that
						      specifies the desired element(s). */

 actionFunction, /* Required: The code to run when elements are
							 found. It is passed a jNode to the matched
						     element. */

 bWaitOnce,      /* Optional: If false, will continue to scan for
							  new elements even after the first match is
						      found. */

 iframeSelector  /* Optional: If set, identifies the iframe to
							  search. */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
            .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
					are new.
				*/
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                waitForKeyElements (    selectorTxt,
                                    actionFunction,
                                    bWaitOnce,
                                    iframeSelector
                                   );
            },
                                       300
                                      );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}

////////////////////////////
///     CUSTOMIZACIÓN    ///
////////////////////////////

// Ocultar barra superior inútil
// document.querySelector("#WIN_0_303635200").style.display = 'none';

// Se espera a que Argonauta cargue completamente
var usrText="";
waitForKeyElements("#label301354000", getUser);

function getUser(jNode) {
    usrText = jNode.text ().trim ();
    if (usrText) {
        // waitForKeyElements("#T301444200 > tbody > tr", setStyle);  //overview console
        // waitForKeyElements("#T302087200 > tbody > tr", setStyle);  //incident console
        // waitForKeyElements("#T1020 > tbody > tr", setStyle);       //incident search
        document.title = "Argonauta++"
    }
    else
        return true;  // Sigue esperando.
}

// function setStyle (jNode) {
//     var reLow = new RegExp(".*Baja.*"+usrText+".*", 'ig');
//     var reMed = new RegExp(".*Media.*"+usrText+".*", 'ig');
//     var reHigh = new RegExp(".*Alta.*"+usrText+".*", 'ig');
//     var reCritical = new RegExp(".*Crítica.*"+usrText+".*", 'ig');

//     //remove highlighting selected row
//     jNode.removeClass("SelPrimary");
//     jNode.click(function(){
//         $(this).removeClass("SelPrimary");
//     });

//     //Process all columns
//     jNode.each(function (k, v) {

//         if ($(this).text().match(reLow)) {  //Hightlight current signed in user
//             $(this).css ("color", "#000000");  // Verde Claro
//             //             $(this).find("td").css("background-color", "#aed581");
//         }else if($(this).text().match(reMed)){
//             $(this).css ("color", "#885201");  // Marrón
//             //             $(this).find("td").css("background-color", "#ffb74d");
//         }else if($(this).text().match(reHigh)){
//             $(this).css ("color", "#ff0303");  // Rojo #ff0303
//             //             $(this).find("td").css("background-color", "#e57373");
//         }else if($(this).text().match(reCritical)){
//             $(this).css ("color", "#ef03ff");  // Fucsia #ef03ff
//             //             $(this).find("td").css("background-color", "#d32f2f");
//         }else if($(this).text().match("Baja")){  //Hightlight Other users
//             $(this).css ("color", "#000000");  //light green 900
//             //             $(this).find("td").css("background-color", "#dcedc8");
//         }else if($(this).text().match("Media")){
//             $(this).css ("color", "#885201");  //orange 900
//             //             $(this).find("td").css("background-color", "#ffe0b2");
//         }else if($(this).text().match("Alta")){
//             $(this).css ("color", "#ff0303");  //red 900
//             //             $(this).find("td").css("background-color", "#ffcdd2");
//         }else if($(this).text().match("Crítica")){
//             $(this).css ("color", "#ef03ff");  //white
//             //             $(this).find("td").css("background-color", "#ef5350");
//         }
//     });
// }

GM_addStyle("                                       \
/*Oculta el tooltip molesto e inútil*/              \
#artooltip{                                         \
visibility: hidden !important                       \
}                                                   \
/*Increase text size in Notes window*/              \
#editor{                                            \
font-size: 11px;                                    \
}                                                   \
");

// GM_addStyle("                                       \
// // Oculta el tooltip molesto e inútil               \
// #artooltip{                                         \
// visibility: hidden !important                       \
// }                                                   \
// /*highlight on mouse hover*/                        \
// #T301444200 > tbody > tr:nth-child(n+1):hover td,   \
// #T302087200 > tbody > tr:nth-child(n+1):hover td,   \
// #T1020 > tbody > tr:nth-child(n+1):hover td{        \
// background-color: #c7c7c7 !important;               \
// }                                                   \
// /*Increase text size in Notes window*/              \
// #editor{                                            \
// font-size: 11px;                                    \
// }                                                   \
// ");
