
var prefPaneState  = 0;
var refreshPage    = 1;
var cmdPaneState   = 0;
var origRefreshVal = 0;
var curRefreshVal  = 0;

/* toggle the visibility of the preferences pane */
function togglePreferencePane(theme, state) {
  var pane = document.getElementById('pref_pane');
  var img  = document.getElementById('pref_pane_button');
  if(state == 0) { prefPaneState = 1; }
  if(state == 1) { prefPaneState = 0; }
  if(prefPaneState == 0) {
    pane.style.visibility = "visible";
    img.style.visibility  = "visible";
    prefPaneState = 1;
  }
  else {
    pane.style.visibility = "hidden";
    img.style.visibility  = "hidden";
    prefPaneState = 0;
  }
}

/* save settings in a cookie */
function prefSubmit(url, current_theme) {
  var sel         = document.getElementById('pref_theme')
  var now         = new Date();
  var expires     = new Date(now.getTime() + (10*365*86400*1000)); // let the cookie expire in 10 years
  if(current_theme != sel.value) {
    document.cookie = "thruk_theme="+sel.value + "; path=/; expires=" + expires.toGMTString() + ";";
    window.status   = "thruk preferences saved";
    window.location = url;
  }
}

/* page refresh rate */
function setRefreshRate(rate) {
  curRefreshVal = rate;
  var obj = document.getElementById('refresh_rate');
  if(refreshPage == 0) {
    obj.innerHTML = "<span id='refresh_rate'>This page will not refresh automatically <input type='button' value='refresh now' onClick='window.location.reload(true)'></span>";
  }
  else {
    obj.innerHTML = "<span id='refresh_rate'>Update in "+rate+" seconds <input type='button' value='stop' onClick='stopRefresh()'></span>";
    if(rate == 0) {
      window.location.reload(true);
    }
    if(rate > 0) {
      newRate = rate - 1;
      setTimeout("setRefreshRate(newRate)", 1000);
    }
  }
}
function stopRefresh() {
  refreshPage = 0;
  setRefreshRate(0);
}

/* set border color as mouse over for top row buttons*/
function button_over(button)
{
   button.style.borderColor = "#555555";
}
function button_out(button)
{
   button.style.borderColor = "#999999";
}

/* toggle querys for this backend */
function toggleBackend(backend) {
  var button        = document.getElementById('button_' + backend);

  initial_state = initial_backend_states.get(backend);
  if(button.className == "button_peerDIS") {
    if(initial_state == 1) {
      button.className = 'button_peerDOWN';
    }
    else if(initial_state == 3) {
      button.className = 'button_peerHID';
    }
    else {
        button.className = 'button_peerUP';
    }
    current_backend_states.set(backend, 0);
  } else {
    button.className = "button_peerDIS";
    current_backend_states.set(backend, 2);
  }

  /* save current selected backends in session cookie */
  document.cookie = "thruk_backends="+current_backend_states.toQueryString()+ "; path=/;";
  if(initial_state != 3) {
    document.location.reload();
  }
}

/***************************************
 * Mouse Over for Status Table
 * to select hosts / services
 * for sending quick commands
 **************************************/
var selectedServices = new Hash;
var selectedHosts    = new Hash;
function addRowSelector(id)
{
    var table = document.getElementById(id);
    var rows  = table.tBodies[0].rows;

    // for each table row, beginning with the second ( dont need table header )
    for(var row_nr = 1; row_nr < rows.length; row_nr++) {
        var cells = rows[row_nr].cells;

        // for each cell in a row
        for(var cell_nr = 0; cell_nr < cells.length; cell_nr++) {
            if(cell_nr == 0 && cells[0].innerHTML != '') {
                addEventHandler(cells[cell_nr], 'host');
            }
            if(cell_nr >= 1) {
                addEventHandler(cells[cell_nr], 'service');
            }
        }
    }
}

/* add the event handler */
function addEventHandler(elem, type) {
    if(type == 'host') {
        elem.onmouseover = highlightHostRow;
        elem.onmouseout  = resetHostRow;
        elem.onclick     = selectHost;
    }
    if(type == 'service') {
        elem.onmouseover = highlightServiceRow;
        elem.onmouseout  = resetServiceRow;
        elem.onclick     = selectService;
    }
}

/* returns the first element which has an id */
function getFirstParentId(elem) {
    nr = 0;
    while(nr < 100 && (!elem.id || elem.id == '')) {
        nr++;
        elem = elem.parentNode;
    }
    return elem.id;
}

/* set style for each cell */
function setRowStyle(row_id, style, type, force) {

    var row = document.getElementById(row_id);

    // for each cells in this row
    var cells = row.cells;
    for(var cell_nr = 0; cell_nr < cells.length; cell_nr++) {
        // only the first cell for hosts
        // all except the first cell for services
        if((type == 'host' && cell_nr == 0) || (type == 'service' && cell_nr >= 1)) {
            // set style for cell itself
            styleElements(cells[cell_nr], style, force)

            // and for all row elements below
            var elems = cells[cell_nr].getElementsByTagName('TR');
            styleElements(elems, style, force)

            // and for all cell elements below
            var elems = cells[cell_nr].getElementsByTagName('TD');
            styleElements(elems, style, force)
        }
    }
}

/* save current style and change it*/
function styleElements(elems, style, force) {
    if (elems==null || typeof(elems)!="object" || typeof(elems.length)!="number") {
        elems = new Array(elems);
    }
    for(var x = 0; x < elems.length; x++) {
        if(style == 'original') {
            // reset style to original
            if(elems[x].className == "tableRowHover" || force) {
                elems[x].className = elems[x].origClass;
            }
        }
        else {
            if(elems[x].className != "tableRowSelected" || force) {
                // save style in custom attribute
                if(!elems[x].hasAttribute('origClass')) {
                    elems[x].setAttribute('origClass', elems[x].className);
                    elems[x].origClass = elems[x].className;
                }

                // set new style
                elems[x].className = style;
            }
        }
    }
}

/* this is the mouseover function for services */
function highlightServiceRow(event)
{
    // find id of current row
    var row_id = getFirstParentId(event.target.parentNode);
    setRowStyle(row_id, 'tableRowHover', 'service');
}

/* this is the mouseover function for hosts */
function highlightHostRow(event)
{
    // find id of current row
    var row_id = getFirstParentId(event.target.parentNode);
    setRowStyle(row_id, 'tableRowHover', 'host');
}

/* select this service */
function selectService(event, state)
{
    var row_id;
    if(!event) {
        return;
    }
    // find id of current row
    if(event.target) {
        row_id = getFirstParentId(event.target);
    } else {
        row_id = getFirstParentId(event);
    }
    if(!row_id) {
        return;
    }
    var targetState;
    if(!Object.isUndefined(state)) {
        targetState = state;
    }
    else if(selectedServices.get(row_id)) {
        targetState = false;
    }
    else {
        targetState = true;
    }
    if(targetState) {
        setRowStyle(row_id, 'tableRowSelected', 'service', true);
        selectedServices.set(row_id, 1);
    } else {
        setRowStyle(row_id, 'original', 'service', true);
        selectedServices.unset(row_id);
    }
    checkCmdPaneVisibility();
}

/* select this host */
function selectHost(event)
{
    // find id of current row
    var row_id = getFirstParentId(event.target.parentNode);
    if(selectedHosts.get(row_id)) {
        setRowStyle(row_id, 'original', 'host', true);
        selectedHosts.unset(row_id);
    } else {
        setRowStyle(row_id, 'tableRowSelected', 'host', true);
        selectedHosts.set(row_id, 1);
    }
    checkCmdPaneVisibility();
}

/* reset row style unless it has been clicked */
function resetServiceRow(event)
{
    var row_id;
    if(!event) {
        return;
    }
    // find id of current row
    if(event.target) {
        row_id = getFirstParentId(event.target);
    } else {
        row_id = getFirstParentId(event);
    }
    if(!row_id) {
        return;
    }
    setRowStyle(row_id, 'original', 'service');
}

/* reset row style unless it has been clicked */
function resetHostRow(event)
{
    // find id of current row
    var row_id = getFirstParentId(event.target.parentNode);
    setRowStyle(row_id, 'original', 'host');
}
/* select or deselect all services */
function selectAllServices(state) {
    if(state) {
        var classes = new Array('.statusOK', '.statusWARNING', '.statusUNKNOWN', '.statusCRITICAL', '.statusPENDING');
    }
    else {
        var classes = new Array('.tableRowSelected');
    }
    classes.each(function(classname) {
        $$(classname).each(function(obj) {
            selectService(obj, state);
        })
    });
}
function selectServicesByClass(classes) {
    classes.each(function(classname) {
        $$(classname).each(function(obj) {
            selectService(obj, true);
        })
    });
}

/* toggle the visibility of the command pane */
function toggleCmdPane(state) {
  var pane = document.getElementById('cmd_pane');
  if(state == 0) { cmdPaneState = 1; }
  if(state == 1) { cmdPaneState = 0; }
  if(cmdPaneState == 0) {
    pane.style.visibility = "visible";
    cmdPaneState          = 1;
  }
  else {
    pane.style.visibility = "hidden";
    cmdPaneState          = 0;
  }
}

/* show command panel if there are services or hosts selected otherwise hide the panel */
function checkCmdPaneVisibility() {
    var size = selectedServices.size() + selectedHosts.size();
    if(size == 0) {
        /* hide command panel and reenable refresh */
        toggleCmdPane(0);
        refreshPage = 1;
        setRefreshRate(origRefreshVal);
    } else {
        /* show command panel and disable page refresh */
        if(refreshPage == 1) {
            origRefreshVal = curRefreshVal;
            toggleCmdPane(1);
        }
        stopRefresh();

        /* set submit button text */
        var btn = document.getElementById('multi_cmd_submit_button');
        var ssize = selectedServices.size();
        var hsize = selectedHosts.size();
        var serviceName = "services";
        if(ssize == 1) { serviceName = "service";  }
        var hostName = "hosts";
        if(hsize == 1) { hostName = "host";  }
        var text;
        if( hsize > 0 && ssize > 0 ) {
            text = ssize + " " + serviceName + " and " + hsize + " " + hostName;
        }
        else if( hsize > 0 ) {
            text = hsize + " " + hostName;
        }
        else if( ssize > 0 ) {
            text = ssize + " " + serviceName;
        }
        btn.value = "submit command for " + text;
    }
}

/* collect selected hosts and services and pack them into nice form data */
function collectFormData() {
    var services = new Array();
    selectedServices.keys().each(function(row_id) {
        services.push(getServiceNameForRowId(row_id));
    });
    service_form = document.getElementById('selected_services');
    service_form.value = services.join(',');

    var hosts = new Array();
    selectedHosts.keys().each(function(row_id) {
        hosts.push(getHostNameForRowId(row_id));
    });
    host_form = document.getElementById('selected_hosts');
    host_form.value = hosts.join(',');
}

/* return the host;service for a row */
function getServiceNameForRowId(row_id) {
    return servicesHash.get(row_id);
}

/* return the host for a row */
function getHostNameForRowId(row_id) {
    var data = servicesHash.get(row_id);
    var pos  = data.indexOf(';');
    return data.substr(0,pos);
}