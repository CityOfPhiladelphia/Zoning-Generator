import $ from 'jquery';
import L from 'leaflet';
import './leaflet.zoomhome.js';
import { tiledMapLayer, featureLayer, query } from 'esri-leaflet';

import { useRouter } from 'vue-router';
const router = useRouter();
console.log('router 1:', router);

let new_event_marker,
  endZoningDate,
  drawPoly,
  overlay_name,
  overlay_link,
  overlay_code,
  overlay_pending,
  overlay_pendingBill,
  overlay_pendingLink,
  lats,
  lons,
  coordinates;

import zoningCodeRules from '../tables/baseDistricts.js';
// import overlayRules from '../tables/overlaysNew.js';

$(function (router) {
    console.log('router 2:', router);
    var overlayslist = [];
    var overlayDict = {};
    $(".HideUnhide").hide();
    $("#PrintBtn").hide();
    
    function getZoningInfo(place) {
        map.flyTo(place, 18);
        // Creates a dictionary of overlays based on the returned list of overlays and pulls in data from overlaysNew.json to get text to populate app
        function showResults(featureSet) {
            var resultFeatures = featureSet.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
                overlay_name = resultFeatures[i].properties.OVERLAY_NAME;
                overlay_link = resultFeatures[i].properties.CODE_SECTION_LINK;
                overlay_code = resultFeatures[i].properties.CODE_SECTION;
                overlay_pending = resultFeatures[i].properties.PENDING;
                overlay_pendingBill = resultFeatures[i].properties.PENDINGBILL;
                overlay_pendingLink = resultFeatures[i].properties.PENDINGBILLURL;
                //var overlayJSON = overlayRules;
                //var mainText = overlayJSON[overlay_name].Version1;
                //var altText = overlayJSON[overlay_name].Version2;
                //var dontInclude = overlayJSON[overlay_name].DoNotInclude;
//                overlayDict[overlay_name] = [overlay_link, overlay_code, mainText, altText, dontInclude, overlay_pending, overlay_pendingBill, overlay_pendingLink];
                overlayDict[overlay_name] = [overlay_link, overlay_code, overlay_pending, overlay_pendingBill, overlay_pendingLink];
                overlayslist[i] = overlay_name;            
            }
        }       

        // Queries Zoning Overlay layer hosted on phl.maps.arcgis.com to find intersecting overlays
        // If no overlays are present at that location, html elements are returned blank
        // If overlays are present at that location, the function to create a table for overlays takes the overlay dictionary and zoning for that location kicks off
        // Queries local historic sites and districts to identify if a location is historic and populates elements with disclaimer if there is a site or district present
        function getOverlays(geography, zoningtocheck) {
            document.getElementById("pendingOverlayAlert").innerHTML = ""
            overlayDict = {};
            overlayslist = [];
            // var query_overlay = L.esri.query({
            var query_overlay = query({
                url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zoning_Overlays/FeatureServer/0'
            });
            query_overlay.intersects(geography);
            query_overlay.outFields = ["OVERLAY_NAME", "CODE_SECTION_LINK"];
            query_overlay.run(function (error, featureCollection, response) {
                if (featureCollection.features.length == 0) {
                    document.getElementById("overlayHeading").innerHTML = "OVERLAY ZONING";
                    document.getElementById("overlaySubheading").innerHTML = "There are no overlays that impact this property.";
                    document.getElementById("overlayTable").innerHTML = "";
                }
                else {
                    showResults(featureCollection);
                    console.log(overlayDict)
                    createOverlayTables(overlayDict, zoningtocheck);
                }
            });
            document.getElementById("historicHeading").innerHTML = ""
            document.getElementById("historicInfo").innerHTML = ""
            // var query_historicLocalSites = L.esri.query({
            var query_historicLocalSites = query({
                url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Historic_sites_PhilReg/FeatureServer/0'
            });
            query_historicLocalSites.intersects(geography);
            query_historicLocalSites.outfields = ["LOC"];
            query_historicLocalSites.run(function (error, featureCollection, response){
                if (featureCollection.features.length == 0){
                    console.log(featureCollection.features.length)
                }
                else {
                    document.getElementById("historicInfo").innerHTML = "This parcel is regulated by the Historical Commission for historic preservation purposes because it is designated as historic or under consideration for designation. The Historical Commission’s review and approval is required to obtain a building permit for the parcel. Nearly 95% of all reviews are conducted by the Historical Commission’s staff, usually within five days. The Historical Commission and its advisory Architectural Committee review the remaining 5% of applications at their monthly meetings."
                    document.getElementById("historicHeading").innerHTML = "Historic Designation"
                    console.log(featureCollection)
                }
            });
            // var query_historicLocalDistricts = L. esri.query({
            var query_historicLocalDistricts = query({
                url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/HistoricDistricts_Local/FeatureServer/0'
            });
            query_historicLocalDistricts.intersects(geography);
            query_historicLocalDistricts.outfields = ["NAME"];
            query_historicLocalDistricts.run(function (error, featureCollection, response){
                var localdistrict = featureCollection.features.length;
                if (featureCollection.features.length == 0){
                    console.log(featureCollection.features.length)
                }
                else {
                    document.getElementById("historicInfo").innerHTML = "This parcel is regulated by the Historical Commission for historic preservation purposes because it is designated as historic or under consideration for designation. The Historical Commission’s review and approval is required to obtain a building permit for the parcel. Nearly 95% of all reviews are conducted by the Historical Commission’s staff, usually within five days. The Historical Commission and its advisory Architectural Committee review the remaining 5% of applications at their monthly meetings."
                    document.getElementById("historicHeading").innerHTML = "Historic Designation";
                }
            })
        }
        function overlayAlert(_pending, pendLink, pendBill){
            if (_pending != "Yes"){
                document.getElementById("pendingOverlayAlert").innerHTML = ""
            }
            else {
                var pendingOverlay = document.getElementById("pendingOverlayAlert");
                pendingOverlay.innerHTML = "<div class='callout'><p><b>Attention: Pending Overlay Zoning Ordinance</b></p><p>A bill under consideration by City Council would affect the overlay zoning of this parcel.  Any provision of the bill under consideration that is more restrictive than the current law will be applied if development occurs while the ordinance remains pending. See <a href=" + pendLink + " target='_blank'>" + "Bill " + pendBill + "<i class = 'fas fa-external-link-alt' span style='font-size: 14px'; ></i></a> or call Development Services at 215-683-4686 for more information.</p></div>";
            }
            
        }  

        // Populates up the overlay table that will populate the overlay section.
        // Overlay rules can vary depending on base zoning. In some cases, overlays might only apply to certain base districts or certain base districts can be exempt or just be slightly different.
        // The following goes through and first sorts out overlays that are not included and then works through logic to determine which version of the overlay rules to display. All others default to first version.
        function createOverlayTables(overlays, zoningx) {
            var table = document.getElementById("overlayTable");
            table.innerHTML = "";
            var x = 0;
            for (var i in overlays) {
                var link = overlays[i][0];
                var name = i;
                var codenum = "<a href=" + link + " target='_blank'><b>" + overlays[i][1]+ "</b>" + "<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>";
                ///Function below adds the the overlay to the overlay table based on the variables determined in the if/else statements for each overlay that has different version.
               // if (overlays[i][4] == null) {
                    function tablesetup() {
                        var row = table.insertRow(x);
                        var codeCell = row.insertCell(0);
                        var nameCell = row.insertCell(1);
                        //var descCell = row.insertCell(2);
                        //codeCell.style.width = '10%';
                        codeCell.style.width = '30%';
                        codeCell.style.fontSize = '13px';
                        //nameCell.style.width = '30%';
                        nameCell.style.width = '60%';
                        nameCell.style.fontSize = '13px';
                        //descCell.style.width = '65%';
                        //descCell.style.fontSize = '13px';
                        codeCell.href = link;
                        codeCell.innerHTML = codenum;
                        nameCell.innerHTML = name;
                        //descCell.innerHTML = codedesc;
                        x++
                        var pendcheck = overlays[i][5];
                        var pendingLink = overlays[i][7];
                        var pendingBill = overlays[i][6]
                        console.log(pendcheck)
                        overlayAlert(pendcheck, pendingLink, pendingBill)
                    }
                    /* if (name == "/CDO Central Delaware Riverfront Overlay District") {//This overlay does not apply to I-P
                        if (zoningx !== "IP") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Broad Street Area Central") {//One version applying to Commercial zoning, one for everything else
                        if (zoningx == "CMX1" || zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Broad Street Area Mid-North") {//One version applying to Commercial zoning, one for everything else
                        if (zoningx == "CMX1" || zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Center City Commercial District Control Area") {//One version applying to CMX2 zoning, one for everything else
                        if (zoningx == "CMX2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Center City Residential District Control Area") {//One version applying to RM1 zoning, one for RSA5, otherwise this overlay doesn't apply
                        if (zoningx == "RM1") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else if (zoningx == "RSA5") {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Chestnut and Walnut Street Area East") {//One version applying to RMX3, CMX4, and CMX5, one for everything else
                        if (zoningx == "RMX3" || zoningx == "CMX4" || zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Chestnut and Walnut Street Area West") {//One version applying to RMX3, CMX4, and CMX5, one for everything else
                        if (zoningx == "RMX3" || zoningx == "CMX4" || zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - John F. Kennedy Boulevard Area") {//Applies only to RMX3, CMX4, and CMX5
                        if (zoningx == "RMX3" || zoningx == "CMX4" || zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Locust Street Area") {//One version applying to RMX3, CMX4, and CMX5, one for everything else
                        if (zoningx == "RMX3" || zoningx == "CMX4" || zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Minimum Building Height Area") {//Applies only to RMX3, CMX4, and CMX5
                        if (zoningx == "RMX3" || zoningx == "CMX4" || zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Spruce Street Area") {//Applies only to RMX3, CMX4, and CMX5
                        if (zoningx == "RMX3" || zoningx == "CMX4" || zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/FAO Frankford Academy Overlay District") {//Applies only to CA2
                        if (zoningx == "CA2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/NCA Neighborhood Commercial Area Overlay District - East Falls Neighborhood") {//Applies only to commercial zoning
                        if (zoningx == "CMX1" || zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/NCA Neighborhood Commercial Area Overlay District - East Mount Airy") {//Applies only to CMX1
                        if (zoningx == "CMX1") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/NCA Neighborhood Commercial Area Overlay District - Germantown Avenue") {//Applies only to commercial zoning, but not CMX1
                        if (zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/NCA Neighborhood Commercial Area Overlay District - North Delaware Avenue") {//Applies only to commercial zoning
                        if (zoningx == "CMX1" || zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/NCP North Central Philadelphia Overlay District - Subarea C") {//One version applying to RM1, one for everything else
                        if (zoningx == "RM1") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/NE Northeast Overlay District - Map A") {//One version applying to CMX, CA, IRMX and I2 zoning, one for I1, but doesn't apply to other zoning
                        if (zoningx == "CMX1" || zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2" || zoningx == "IRMX" || zoningx == "ICMX" || zoningx == "I2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else if (zoningx == "I1") {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/NE Northeast Overlay District - Map B") {//One version applying to CMX, CA, IRMX and I2 zoning, one for I1, but doesn't apply to other zoning
                        if (zoningx == "CMX1" || zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2" || zoningx == "IRMX" || zoningx == "ICMX" || zoningx == "I2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else if (zoningx == "I1") {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/WST West Overlay District - Subarea B") {//One version for CMX5, one for everything else
                        if (zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "/WWA West Washington Avenue Overlay District") {//One version for CMX3, one for everything else
                        if (zoningx == "CMX3") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                        else {
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                    }
                    else if (name == "Motor Vehicle Parking Ratios - Regulations Applicable to Specific Areas - Delaware River Waterfront") {//Applies only to commercial zoning
                        if (zoningx == "CMX1" || zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/CTR Center City Overlay District - Spruce Street Area East") {//Does not apply to locations also within the Broad Street Area Mid-south
                        if ("/CTR Center City Overlay District - Broad Street Area Mid-South" in overlays) {
                            console.log("")
                        }
                        else {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "Dimensional Standards - Commercial Districts Dimensional Table - Center City/University City Floor Area Ratio Map") {//Only applies to CMX5 zoning
                        if (zoningx == "CMX5") {
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name == "/NCA Neighborhood Commercial Area Overlay District - Germantown Avenue - Chestnut Hill Subarea"){ //Only applies to Zoned commercial AND NOT zoned CMX-1
                        if (zoningx == "CMX2" || zoningx == "CMX2.5" || zoningx == "CMX3" || zoningx == "CMX4" || zoningx == "CMX5" || zoningx == "CA1" || zoningx == "CA2"){
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if (name =="/WOA West Oregon Avenue Overlay District"){//Only applies to CMX-3 or CA-1
                        if (zoningx == "CMX3" || zoningx == "CA1"){
                            var codedesc = overlays[i][2];
                            tablesetup();
                        }
                    }
                    else if(name =="Use-Specific Standards - Child Care - Family Child Care - Area 1 and Area 2"){//Applies different to RSD and non-RSD
                        if (zoningx == "RSD1" || zoningx == "RSD2" || zoningx == "RSD3"){
                            var codedesc = overlays[i][3];
                            tablesetup();
                        }
                        else{
                            var codedesc = overlays[i][2]
                            tablesetup()
                        }
                    }
                    else if(name=="Use-Specific Standards - Child Care - Family Child Care - Area 3"){//Applies differently to RSA 5 vs all others
                        if (zoningx=="RSA5"){
                            var codedesc = overlays[i][3];
                            tablesetup()
                        }
                        else{
                            var codedesc = overlays[i][2]
                            tablesetup()
                        }
                    }
                    else {//All other overlays should use the first version to populate text
                        var codedesc = overlays[i][2];
                        tablesetup();
                    } */
                //}
                tablesetup()
            }
            if (x == 0) {//If, after running through the overlay dictionary no overlays have been added to the table, the heading is blank, otherwise the headings are populated
                document.getElementById("overlayHeading").innerHTML = "OVERLAY ZONING";
                document.getElementById("overlaySubheading").innerHTML = "There are no overlays that impact this property.";
            }
            else {
                document.getElementById("overlayHeading").innerHTML = "OVERLAY ZONING";
                document.getElementById("overlaySubheading").innerHTML = "Unless otherwise specified, the below Overlays override the above Base Zoning if they conflict.";
            }
        }
        
        // var query_citylimits = L.esri.query({
        var query_citylimits = query({
            url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/City_Limits/FeatureServer/0'
        });
        // var query_zoning = L.esri.query({
        var query_zoning = query({
            url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zoning_BaseDistricts/FeatureServer/0'
        });
        
        query_zoning.intersects(place);
        query_zoning.run(function (error, featureCollection, response) {
            //If there is no zoning at location, HTML page will print "This point is not zoned" and nothing else
            if (featureCollection.features.length == 0) {
                query_citylimits.intersects(place);
                query_citylimits.run(function (error, featureCollection, response){
                    if (featureCollection.features.length == 0){
                        document.getElementById("parcelAddress").innerHTML = "This application only provides information within the City of Philadelphia. Please select a location within Philadelphia."
                    }
                    else {
                        document.getElementById("parcelAddress").innerHTML = "This point is not zoned";
                    }
                })
                document.getElementById("zoningDescription").innerHTML = "";
                document.getElementById("baseZoning").innerHTML = "";
                document.getElementById("baseZoningTitle").innerHTML = "";
                document.getElementById("useRegs").innerHTML = "";
                document.getElementById("structByRightTitle").innerHTML = "";
                document.getElementById("structByRight").innerHTML = "";
                document.getElementById("UsesByRight").innerHTML = "";
                document.getElementById("theUsesbyRightAre").innerHTML = "";
                document.getElementById("theUseNote").innerHTML = "";
                document.getElementById("theExceptionsTitle").innerHTML = "";
                document.getElementById("theExceptions").innerHTML = "";
                document.getElementById("useStarredNote").innerHTML = "";
                document.getElementById("multiUseNoteBold").innerHTML = "";
                document.getElementById("multiUseNote").innerHTML = "";
                document.getElementById("acctStructuresLabels").innerHTML = "";
                document.getElementById("acctStructures").innerHTML = "";
                document.getElementById("accStructsConds").innerHTML = "";
                document.getElementById("permAccessUseheader").innerHTML = "";
                document.getElementById("permAccessUseText").innerHTML = "";
                document.getElementById("permAccessUseCond").innerHTML = "";
                document.getElementById("dimStandsLabel").innerHTML = "";
                document.getElementById("parkCodeLabel").innerHTML = "";
                document.getElementById("fencelabel").innerHTML = "";
                document.getElementById("fencedata").innerHTML = "";
                document.getElementById("otherConcerns").innerHTML = "";
                document.getElementById("otherConcernDisclaimer").innerHTML = "";
                document.getElementById("overlayHeading").innerHTML = "";
                document.getElementById("overlaySubheading").innerHTML = "";
                document.getElementById("overlayTable").innerHTML = "";
                document.getElementById("dimTable").innerHTML = "";
                document.getElementById("parkTable").innerHTML = "";
                document.getElementById("signTable").innerHTML = "";
                document.getElementById("signLabel").innerHTML = "";
                document.getElementById("localHistoricSites").innerHTML = "";
                document.getElementById("localHistoricDistricts").innerHTML = "";
                document.getElementById("historicHeading").innerHTML = "";
                document.getElementById("Disclosure").innerHTML="";
                document.getElementById("DisclosureP2").innerHTML="";
                document.getElementById("atlasFooter").innerHTML="<a href=" + "https://atlas.phila.gov/" + " target='_blank'>" + "Atlas" + "</a>";
                document.getElementById("atlasNav").innerHTML="<a href=" + "https://atlas.phila.gov/" + " target='_blank'>" + "<b>Additional Property Info" + "</b></a>";
            }
        
            else {// There IS zoning at location
                var zoningDate = new Date();
                zoningDate.setDate(zoningDate.getDate()-1);
                var zoningDay = zoningDate.getDate();
                var zoningMonth = zoningDate.getMonth()+1;
                var zoningYear = zoningDate.getFullYear();
                endZoningDate = zoningMonth + "/" + zoningDay + "/" + zoningYear

                document.getElementById("Disclosure").innerHTML="The Zoning Summary Generator Tool is maintained by the Philadelphia Department of Planning and Development. This tool is designed to help property owners, developers, and neighbors understand what may be allowed on a specific property under the Philadelphia Zoning Code.  The base and overlay zoning districts displayed are current as of " + endZoningDate + ", and the text displayed is current as of 8/27/2024. No information here is legally binding, and nothing stated here represents an official opinion of the City of Philadelphia or any of its departments, boards, or commissions. Please review our <a href='terms.html'>Terms of Use</a> for more information.";
                document.getElementById("DisclosureP2").innerHTML="Did you find an error or have a problem using this page? Please send a description of the problem to <a href='mailto:Planning.Development@phila.gov'>Planning.Development@phila.gov</a> or call 215-683-4686 so that we can help you and improve this tool!";
                var zoningHere = featureCollection.features[0].properties.LONG_CODE;
                var zoningShort = featureCollection.features[0].properties.CODE;
                var zoningPending = featureCollection.features[0].properties.PENDING;
                var zoningPendingBill = featureCollection.features[0].properties.PENDINGBILL;
                var zoningPendingLink = featureCollection.features[0].properties.PENDINGBILLURL;
                if (zoningPending != "Yes"){
                    document.getElementById("pendingZoningAlert").innerHTML = ""
                }
                else {
                    var pendingZoning = document.getElementById("pendingZoningAlert");
                    pendingZoning.innerHTML = "<div class='callout'><p><b>Attention: Pending Base Zoning Ordinance</b></p><p>A bill under consideration by City Council would affect the base zoning of this parcel.  Any provision of the bill under consideration that is more restrictive than the current law will be applied if development occurs while the ordinance remains pending. See <a href=" + zoningPendingLink + " target='_blank'>" + "Bill " + zoningPendingBill + "<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a> or call Development Services at 215-683-4686 for more information.</p></div>";
                } 
                // var query_parcel = L.esri.query({
                var query_parcel = query({
                    url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PWD_PARCELS/FeatureServer/0'
                });
                query_parcel.intersects(place); //  Looks up parcel at the lat/long found from AIS search either clicking or address search. The parcel is important for overlays and also looks up the address.
                query_parcel.run(function (error, featureCollection, response) {
                    //  Overlays can cut through parcels but they are still apply if any part intersects the parcel. If there isn't
                    if (featureCollection.features.length == 0) {
                        //  if no parcel exists...
                        //  1) Sets html element to inform that it's not in a parcel
                        //  2) Queries all overlays that intersect the lat/long of lat/long. The parameters for getOverlays are the lat/long and the zoning at that location
                        document.getElementById("parcelAddress").innerHTML = "This point is not in a parcel";
                        getOverlays(place, zoningShort);
                    }
                    else {
                        //  if parcel exists:
                        //  1) find the address from that parcel
                        //  2) Create a link for that address's page in atlas to replace generic atlas link in footer and navigation
                        //  3) Create a polygon of the parcel and add it to the map
                        //  4) Query all overlays that intersect the any part of the parcel. The parameters to getOverlays is the geometry of the polygon and the zoning at that location
                        var addy = featureCollection.features[0].properties.ADDRESS
                        var replaced = addy.replace(/ /g, '%20');
                        var atlasLink = "<a href=" + "https://atlas.phila.gov/#/" + replaced + "/property" + " target='_blank'>" + addy + "</a>"
                        document.getElementById("atlasFooter").innerHTML = "<a href=" + "https://atlas.phila.gov/#/" + replaced + "/property" + " target='_blank'>" + "Atlas" + "</a>"
                        document.getElementById("atlasNav").innerHTML = "<a href=" + "https://atlas.phila.gov/#/" + replaced + "/property" + " target='_blank'>" + "<b>Additional Property Info" + "</b></a>"
                        document.getElementById("parcelAddress").innerHTML = addy;
                        var polygon = featureCollection.features[0].geometry;
                        getOverlays(polygon, zoningShort);
                        drawPoly = L.geoJSON(polygon).addTo(map);
                        var bounds = drawPoly.getBounds()
                        map.flyToBounds(bounds);
                        router.push({ name: 'address', params: { address: addy } });
                    }
                });
                var mydata = zoningCodeRules; //    identifies the zoning code rules in baseDistricts.json
                var zoningDesc = mydata[zoningShort].DESCRIPTION;
                document.getElementById("zoningDescription").innerHTML = zoningDesc;
                var zoningTitle = mydata[zoningShort].TITLE;
                document.getElementById("baseZoning").innerHTML = zoningHere + ": " + zoningTitle;
                document.getElementById("baseZoningTitle").innerHTML = "BASE ZONING";
                var zoningCode = mydata[zoningShort].CODE;
                var codeLink = mydata[zoningShort].Code_link;
                document.getElementById("useRegs").innerHTML = "Use Regulations" + "<p style='font-size:.60em'>(See also The Philadelphia Code - " + "<a href="+ codeLink + " target='_blank'>" + zoningCode + "<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>)</span></p>";
                var byRightsStruct = mydata[zoningShort].BY_RIGHT_STRUCTURES;
                
                if (byRightsStruct !== null) {
                    document.getElementById("structByRightTitle").innerHTML = "Structure(s) Permitted By-Right: ";
                    document.getElementById("structByRight").innerHTML = byRightsStruct;
                }
                else {
                    document.getElementById("structByRightTitle").innerHTML = "";
                    document.getElementById("structByRight").innerHTML = "";
                }
                
                document.getElementById("UsesByRight").innerHTML = "Use(s) Permitted By-Right: ";
                var usesRight = mydata[zoningShort].BY_RIGHT_USES;
                document.getElementById("theUsesbyRightAre").innerHTML = usesRight;
                
                var useNote = mydata[zoningShort].USE_NOTE;
                if (useNote !== null) {
                    document.getElementById("theUseNote").innerHTML = "<b>Use Note:</b> " + useNote;
                }
                else {
                    document.getElementById("theUseNote").innerHTML = "";
                }
                
                var exceptions = mydata[zoningShort].SPECIAL_EXCEPTION;
                if (exceptions !== null) {
                    document.getElementById("theExceptionsTitle").innerHTML = "Uses Requiring Special Exception: ";
                    document.getElementById("theExceptions").innerHTML = exceptions;
                }
                else {
                    document.getElementById("theExceptionsTitle").innerHTML = "";
                    document.getElementById("theExceptions").innerHTML = "";
                }
                document.getElementById("useStarredNote").innerHTML = "* Use-specific design standards <a href=" + "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-292431" + " target='_blank'>" +"(14-603) <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a> may apply.";
                
                var multiusenote = mydata[zoningShort].MULTIUSE_NOTE;
                if (multiusenote !== null) {
                    document.getElementById("multiUseNoteBold").innerHTML = "Multi-Use Rules";
                    document.getElementById("multiUseNote").innerHTML = multiusenote;
                }
                else {
                    document.getElementById("multiUseNoteBold").innerHTML = "";
                    document.getElementById("multiUseNote").innerHTML = "";
                }
                
                var accStructs = mydata[zoningShort].ACCESSORY_STRUCTURES;
                var accStructsCond = mydata[zoningShort].ACC_STRUCT_COND;
                if (accStructs !== null) {
                    document.getElementById("acctStructuresLabels").innerHTML = "Permitted Accessory Structures: ";
                    document.getElementById("acctStructures").innerHTML = accStructs;
                }
                else {
                    document.getElementById("acctStructuresLabels").innerHTML = "";
                    document.getElementById("acctStructures").innerHTML = "";
                }
                if (accStructsCond !== null) {
                    document.getElementById("accStructsConds").innerHTML = ". Conditions apply or exceptions are required for " + accStructsCond + "; see <a href=" + "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-292621 target='blank'>14-604 <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>.";
                }
                else {
                    document.getElementById("accStructsConds").innerHTML = "";
                }
                
                var permAccessUse = mydata[zoningShort].ACCESSORY_USES;
                var accUseCon = mydata[zoningShort].ACC_USE_COND;
                if (permAccessUse !== null) {
                    document.getElementById("permAccessUseheader").innerHTML = "Permitted Accessory Uses: ";
                    document.getElementById("permAccessUseText").innerHTML = permAccessUse + " are allowed as long as they comply with <a href=" + "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-292621 target='blank'>14-604 <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a> and any other applicable standards. ";
                }
                else {
                    document.getElementById("permAccessUseheader").innerHTML = "";
                    document.getElementById("permAccessUseText").innerHTML = "";
                }
                
                if (accUseCon !== null) {
                    document.getElementById("permAccessUseCond").innerHTML = "Conditions apply or exceptions are required for " + accUseCon + "; see <a href=" + "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-292621 target='blank'>14-604 <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>.";
                }
                else {
                    document.getElementById("permAccessUseCond").innerHTML = "";
                }
                
                var dimStands = mydata[zoningShort].DimCODE;
                var dimLink = mydata[zoningShort].DimCODE_Link
                if (dimStands !== null) {
                    document.getElementById("dimStandsLabel").innerHTML = "Dimensional Standards" + "<p style='font-size:.60em'>(See also The Philadelphia Code - " + "<a href="+ dimLink + " target='_blank'>" + dimStands + "<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>)</p>";
                }
                else {
                    document.getElementById("dimStandsLabel").innerHTML = "";
                }
                
                function createDimensionTable(zoningx) {
                    var dimtable = document.getElementById("dimTable");
                    dimtable.innerHTML = "";
                    var x = 0;
                    function dimtablesetup() {
                        var row = dimtable.insertRow(x);
                        var titleCell = row.insertCell(0);
                        var dataCell = row.insertCell(1);
                        titleCell.style.width = '10%';
                        titleCell.style.fontSize = '14px';
                        titleCell.style.fontWeight = "bold";
                        dataCell.style.width = '30%';
                        dataCell.style.fontSize = '14px';
                        titleCell.outerHTML = "<th width='10%'>"+dimheader+"</th>";
                        dataCell.innerHTML = dimdetails;
                        x++
                    }
                    
                    var minLotWidth = mydata[zoningx].MIN_LOT_WIDTH;
                    if (minLotWidth !== null) {
                        var dimheader = "Minimum Lot Width";
                        var dimdetails = minLotWidth;
                        dimtablesetup();
                    }
                    
                    var minStreetFront = mydata[zoningx].MIN_STREET_FRONTAGE;
                    if (minStreetFront !== null) {
                        var dimheader = "Min. Street Frontage";
                        var dimdetails = minStreetFront;
                        dimtablesetup();
                    }
                    
                    var minLotArea = mydata[zoningx].MIN_LOT_AREA;
                    if (minLotArea !== null) {
                        var dimheader = "Min. Lot Area";
                        var dimdetails = minLotArea;
                        dimtablesetup();
                    }
                    
                    var minOpenArea = mydata[zoningx].MIN_OPEN_AREA;
                    if (minOpenArea !== null) {
                        var dimheader = "Min. Open Area";
                        var dimdetails = minOpenArea;
                        dimtablesetup();
                    }
                    
                    var maxOccArea = mydata[zoningx].MAX_OCCUPIED_AREA;
                    if (maxOccArea !== null) {
                        var dimheader = "Max. Occupied Area"
                        var dimdetails = maxOccArea;
                        dimtablesetup();
                    }
                    
                    var frontyarddepth = mydata[zoningx].MIN_FRONT_YARD_DEPTH;
                    if (frontyarddepth !== null) {
                        var dimheader = "Min. Front Yard Depth";
                        var dimdetails = frontyarddepth + " If one side of a block has more than one zone, all structures must be set back by the most restrictive residential district on the block if there is one, and otherwise by the standards of the district that covers the most street frontage.";
                        dimtablesetup();
                    }
                    
                    var sideyarddepth = mydata[zoningx].MIN_SIDE_YARD_DEPTH_;
                    if (sideyarddepth !== null) {
                        var dimheader = "Min. Side Yard Depth";
                        var dimdetails = sideyarddepth;
                        dimtablesetup();
                    }
                    
                    var ressideyarddepth = mydata[zoningx].MIN_SIDE_YARD_DEPTH_RESIDENTIAL;
                    if (ressideyarddepth !== null) {
                        var dimheader = "Min. Side Yard Depth Residential Use";
                        var dimdetails = ressideyarddepth;
                        dimtablesetup();
                    }
                    
                    var nonressideyarddepth = mydata[zoningx].MIN_SIDE_YARD_DEPTH_NONRESIDENTIAL;
                    if (nonressideyarddepth !== null) {
                        var dimheader = "Min. Side Yard Depth Non-Residential Use";
                        var dimdetails = nonressideyarddepth;
                        dimtablesetup();
                    }
                    
                    var minreardepth = mydata[zoningx].MIN_REAR_YARD_DEPTH;
                    if (minreardepth !== null) {
                        var dimheader = "Min. Rear Yard Depth";
                        var dimdetails = minreardepth;
                        dimtablesetup();
                    }
                    
                    var minreararea = mydata[zoningx].MIN_REAR_YARD_AREA;
                    if (minreararea !== null) {
                        var dimheader = "Min. Rear Yard Area";
                        var dimdetails = minreararea;
                        dimtablesetup();
                    }
                    
                    var maxStructHeight = mydata[zoningx].MAX_STRUCTURE_HEIGHT;
                    if (maxStructHeight !== null) {
                        var dimheader = "Max. Structure Height";
                        var dimdetails = maxStructHeight;
                        dimtablesetup();
                    }
                    
                    var minCornHeight = mydata[zoningx].MIN_CORNICE_HEIGHT;
                    if (minCornHeight !== null) {
                        var dimheader = "Min. Cornice Height";
                        var dimdetails = minCornHeight;
                        dimtablesetup();
                    }
                    
                    var maxFloorArea = mydata[zoningx].MAX_FLOOR_AREA;
                    if (maxFloorArea !== null) {
                        var dimheader = "Max. Floor Area Ratio (% of Lot Area)";
                        var dimdetails = maxFloorArea + " | Bonuses may apply for inclusions of public art, public space, moderate/low income units, transit improvements, underground parking/loading, or green building features. See 14-702 for more info.";
                        dimtablesetup();
                    }
                    
                    var bulkMassing = mydata[zoningx].BULK_AND_MASSING;
                    if (bulkMassing !== null) {
                        var dimheader = "Bulk & Massing";
                        var dimdetails = bulkMassing;
                        dimtablesetup();
                    }

                    var otherRules = mydata[zoningx].RULES;
                    if (otherRules !== null) {
                        var dimheader = "Other Rules";
                        var dimdetails = otherRules + " If a property borders more than one street, the Planning Commission will determine what the front, rear, and side yards are. Many architectural features, art pieces, adornments, and other structures are exempt from the dimensional standards in this table. See Table 14-701-6 for more info.";
                        dimtablesetup();
                    }
                }
                
                createDimensionTable(zoningShort);
        
                function createParkingTable(zoningx) {
                    var parktable = document.getElementById("parkTable");
                    parktable.innerHTML = "";
                    var x = 0;
                    function parktablesetup() {
                        var parkrow = parktable.insertRow(x);
                        var pcodeCell = parkrow.insertCell(0);
                        var pnameCell = parkrow.insertCell(1);
                        pcodeCell.style.width = '10%';
                        pcodeCell.style.fontSize = '14px';
                        pcodeCell.style.fontWeight = "bold";
                        pnameCell.style.width = '30%';
                        pnameCell.style.fontSize = '14px';
                        pcodeCell.outerHTML = "<th width='10%'>"+parkheader+"</th>";
                        pnameCell.innerHTML = parkdetails;
                    }
                    var reqPark = mydata[zoningx].REQUIRED_PARKING;
                    var parkCode = mydata[zoningx].REQUIRED_PARKING_CODE;
                    var recParkLink = mydata[zoningx].REQUIRED_PARKING_CODE_Link;
                    if (reqPark !== null) {
                        var parkheader = "Required Parking <br />" + " " + "<a href="+ recParkLink + " target='_blank'>" + parkCode + " <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>";
                        var parkdetails = reqPark;
                        parktablesetup();
                        x++;
                    }
                    var parkStandards = mydata[zoningx].PARKING_STANDARDS;
                    var parkStandardsCode = mydata[zoningx].PARKING_STANDARDS_CODE;
                    var parkStandardsLink = mydata[zoningx].PARKING_STANDARDS_CODE_Link;
                    if (parkStandards !== null) {
                        var parkheader = "Parking Standards <br /> " + " " + "<a href="+ parkStandardsLink + " target='_blank'>" + parkStandardsCode + " <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>";
                        var parkdetails = parkStandards;
                        parktablesetup();
                        x++;
                    }
                    var BIKE_EV = mydata[zoningx].BIKE_EV_DISABLED;
                    var BIKE_EVcode = mydata[zoningx].BIKE_EV_DISABLED_CODE;
                    if (BIKE_EV !== null) {
                        var parkheader = "Other Requirements";
                        var parkdetails = BIKE_EV;
                        parktablesetup();
                        x++;
                    }
                    
                    var loading = mydata[zoningx].REQUIRED_LOADING;
                    var loadingCode = mydata[zoningx].REQUIRED_LOADING_CODE;
                    var loadingLink = mydata[zoningx].REQUIRED_LOADING_CODE_LINK;
                    if (loading !== null) {
                        var parkheader = "Required Off-Street Loading <br />" + " " + "<a href="+ loadingLink + " target='_blank'>" + loadingCode + " <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>";
                        var parkdetails = loading;
                        parktablesetup();
                        x++;
                    }
                }
                
                var code2 = mydata[zoningShort].SPECIAL_ZONING_CODE;
                var specCode2Link = mydata[zoningShort].SPECIAL_ZONING_CODE_Link;
                if (code2 !== null) {
                    document.getElementById("parkCodeLabel").innerHTML = "Parking and Loading" + "<p style='font-size:.60em'>(See also The Philadelphia Code - " + "<a href="+ specCode2Link + " target='_blank'>" + code2 + "<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>)</p>";
                }
                else {
                    document.getElementById("parkCodeLabel").innerHTML = "Parking and Loading";
                }
                
                createParkingTable(zoningShort);
                
                //  Header for Sign Regulations
                var signstands = mydata[zoningShort].SIGN_CODE;
                var signCodeLink = "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-294053"
                if (signstands !== null){
                    document.getElementById("signLabel").innerHTML = "Sign Regulations" + "<p style='font-size:.60em'>(See also The Philadelphia Code - " + "<a href="+ signCodeLink + " target='_blank'>" + signstands + "<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>)</p>";
                }
                else {
                    document.getElementById("signLabel").innerHTML = "Sign Regulations";
                }
                //  Creates Table for sign
                function createSignTable(zoningx){
                    var signtable = document.getElementById("signTable");
                    signtable.innerHTML = "";
                    var x = 0;
                    function signtablesetup(){
                        var signrow = signtable.insertRow(x);
                        var scodeCell = signrow.insertCell(0);
                        var snameCell = signrow.insertCell(1);
                        scodeCell.style.width = '10%';
                        scodeCell.style.fontSize = '14px';
                        scodeCell.style.fontWeight = "bold";
                        snameCell.style.width = '30%';
                        snameCell.style.fontSize = '14px';
                        scodeCell.outerHTML = "<th width='10%'>"+signheader+"</th>";
                        snameCell.innerHTML = signdetails;
                    }
                    
                    var nonAccSign = mydata[zoningShort].SIGN_NON_ACCESSORY_NOTES;
                    if (nonAccSign !== null){
                        var signheader = "Non-Accessory Signs";
                        var signdetails = nonAccSign;
                        signtablesetup();
                        x++;
                    }
                    var AccSign = "For City-Wide rules that apply in addition to the below, see 14-904(1).  All signs which extend above the public right-of-way are subject to Art Commission approval."
                    if (AccSign !== null){
                        var signheader = "Accessory Signs";
                        var signdetails = AccSign;
                        signtablesetup();
                        x++;
                    }
                    
                    var permittedSigns = mydata[zoningShort].SIGN_PERMITTED_SIGNS;
                    if (permittedSigns !== null){
                        var signheader = "Permitted Signs";
                        var signdetails = permittedSigns;
                        signtablesetup();
                        x++;
                    }
                    
                    var maxAreaSigns = mydata[zoningShort].SIGN_MAX_AREA;
                    if (maxAreaSigns !== null){
                        var signheader = "Maximum Size";
                        var signdetails = maxAreaSigns;
                        signtablesetup();
                        x++;
                    }
                    
                    var maxHeighSigns = mydata[zoningShort].SIGN_MAX_HEIGHT;
                    if (maxHeighSigns !== null){
                        var signheader = "Maximum Height";
                        var signdetails = maxHeighSigns;
                        signtablesetup();
                        x++;
                    }
                    
                    var signCharacterSigns = mydata[zoningShort].SIGN_CHARACTERISTICS;
                    var rulesSign = mydata[zoningShort].SIGN_RULES;
                    if (signCharacterSigns !== null || rulesSign !== null){
                        var signheader = "Other Rules";
                        if (signCharacterSigns == null){
                            var signdetails = rulesSign
                        }
                        else if (rulesSign == null){
                            var signdetails = signCharacterSigns
                        }
                        else{
                            var signdetails = signCharacterSigns + " " + rulesSign;
                        }
                        signtablesetup();
                        x++;
                    }
                }
                
                createSignTable(zoningShort);
                var fenceRules = mydata[zoningShort].FENCE_RULES;
                var fenceLink = "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-293559";
                if (fenceRules !== null) {
                    document.getElementById("fencelabel").innerHTML = "Fences" + "<p style='font-size:.60em'>(See also The Philadelphia Code - " + "<a href="+ fenceLink + " target='_blank'>14-706<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>)</p>";
                    document.getElementById("fencedata").innerHTML = fenceRules;
                }
                else {
                    document.getElementById("fencelabel").innerHTML = "";
                    document.getElementById("fencedata").innerHTML = "";
                }
                document.getElementById("otherConcerns").innerHTML = "Other Base Zoning Concerns";
                document.getElementById("otherConcernDisclaimer").innerHTML = "The zoning code (Title 14 of the Philadelphia Code) contains other provisions and restrictions, including situation-specific sections governing signs <a href=" + "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-294053 " + " target='_blank'>" + "(14-900)" + "<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>" + ", outdoor lighting <a href=" + "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-293597" + " target='_blank'>" + "(14-707) <i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>, and subdivisions of land <a href=" + "https://codelibrary.amlegal.com/codes/philadelphia/latest/philadelphia_pa/0-0-0-293630" + " target='_blank'>" + "(14-708)<i class = 'fas fa-external-link-alt' span style='font-size: 12px'; ></i></a>. <br /><br />Other regulations that affect building dimensions, locations, and uses may be found in other sections of the Philadelphia Code and are not covered by this summary.";
            }
        });
    }
    
    function chooseAddr(lat1, lng1) {
        if (typeof (new_event_marker) === 'undefined') {
            new_event_marker = new L.marker([lat1, lng1], { draggable: true });
            new_event_marker.addTo(map);
        }
        else {
            new_event_marker.setLatLng([lat1, lng1]);
        }
        map.setView([lat1, lng1], 18);
        var coordinates = new L.LatLng(lat1, lng1);
        getZoningInfo(coordinates)
    }
    
    function myFunction(arr) {
        var out = "<br />";
        var i;
        if (arr.length > 0) {
            for (i = 0; i < arr.length; i++) {
                out += "<div class='address' title='Show Location and Coordinates' onclick='chooseAddr(" + arr[i].lat + ", " + arr[i].lon + ");return false;'>" + arr[i].display_name + "</div>";
                var coordinates = new L.LatLng(arr[i].lat, arr[i].lon);
                ///getZoningInfo(coordinates)
                chooseAddr(arr[i].lat, arr[i].lon);
            }
            document.getElementById('results').innerHTML = "";
        }
        else {
            document.getElementById('results').innerHTML = "Sorry, no results...";
        }
    }
    
    function addr_search() {
        $(".HideUnhide").show();
        $("#PrintBtn").show();
        const gatekeeperKey = "ad1c7f7c6895cd11c1bec0b53f1e1bab";
        const addressInput = document.getElementById("addr");
        const requestUrl = `https://api.phila.gov/ais/v1/search/${addressInput.value}?gatekeeperKey=${gatekeeperKey}`;
        $.get(requestUrl, function (result) {
            if (result.features.length > 0) {
                const coordinates = new L.LatLng(result.features[0].geometry.coordinates[1], result.features[0].geometry.coordinates[0]);
                if (typeof (new_event_marker) === 'undefined') {
                    new_event_marker = new L.marker(coordinates, { draggable: true });
                    new_event_marker.addTo(map);
                }
                else {
                    new_event_marker.setLatLng(coordinates);
                    drawPoly.remove(map);
                }
                getZoningInfo(coordinates);
            }
        });
    }
    var map = L.map('map', {zoomControl: false}).setView([40.0, -75.14], 12);
    var zoomHome = L.Control.zoomHome();
    zoomHome.addTo(map);
    // L.esri.tiledMapLayer({
    tiledMapLayer({
        url: 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer',
    }).addTo(map);
    
    tiledMapLayer({
        url: 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer',
    }).addTo(map);
    map.invalidateSize();

    function zoningStyle(feature){
        if(feature.properties.CODE==="RSA1" || feature.properties.CODE==="RSA2" || feature.properties.CODE==="RSA3" || feature.properties.CODE==="RSA4" || feature.properties.CODE==="RSA5"){
            return{color: '#F8EF67'}
        }
        else if(feature.properties.CODE==="RSD1" || feature.properties.CODE==="RSD2" || feature.properties.CODE==="RSD3"){
            return{color: '#FEF5C4'}
        }
        else if(feature.properties.CODE==="RTA1"){
            return{color: '#CDB54F'}
        }
        else if(feature.properties.CODE==="RM1" || feature.properties.CODE==="RM2" || feature.properties.CODE==="RM3" || feature.properties.CODE==="RM4" || feature.properties.CODE==="RM5"){
            return{color: '#FCB851'}
        }
        else if(feature.properties.CODE==="RMX1" || feature.properties.CODE==="RMX2" || feature.properties.CODE==="RMX3"){
            return{color: '#E58425'}
        }
        else if(feature.properties.CODE==="CA1" || feature.properties.CODE==="CA2"){
            return{color: '#F7A1A4'}
        }
        else if(feature.properties.CODE==="CMX1" || feature.properties.CODE==="CMX2" || feature.properties.CODE==="CMX2.5"){
            return{color: '#F16667'}
        }
        else if(feature.properties.CODE==="CMX3" || feature.properties.CODE==="CMX4"){
            return{color: '#ED2124'}
        }
        else if(feature.properties.CODE==="CMX5"){
            return{color: '#B22025'}
        }
        else if(feature.properties.CODE==="I1"){
            return{color: '#B37FB7'}
        }
        else if(feature.properties.CODE==="I2"){
            return{color: '#884B9D'}
        }
        else if(feature.properties.CODE==="I3"){
            return{color: '#55489D'}
        }
        else if(feature.properties.CODE==="ICMX"){
            return{color: '#DCBEDB'}
        }
        else if(feature.properties.CODE==="IP"){
            return{color: '#817FBC'}
        }
        else if(feature.properties.CODE==="SPAIR"){
            return{color: '#B1B3B6'}
        }
        else if(feature.properties.CODE==="SPPOA" || feature.properties.CODE == "SPPOP"){
            return{color: '#008E47'}
        }
        else if(feature.properties.CODE==="SPINS"){
            return{color: '#7DB3E1'}
        }
        else if(feature.properties.CODE==="SPSTA"){
            return{color: '#118ACB'}
        }
        else if(feature.properties.CODE==="SPENT"){
            return{color: '#815724'}
        }
        else if(feature.properties.CODE==="IRMX"){
            return{color: '#D4A679'}
        }
        else{
            return{color: "#000000"}
        }
    }
    // var zoningLayer = L.esri.featureLayer({
    var zoningLayer = featureLayer({
        url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zoning_BaseDistricts/FeatureServer/0',
        style: zoningStyle,
        weight: 1,
        fillOpacity: 0.6,
        //minZoom: 15
    });

    L.Control.ZoningButtons = L.Control.extend({
        options: {
            position: 'topright',
            zoningOffText: 'Turn Zoning On/Off',
            zoningOffTitle: 'Turn zoning layer on and off'
        },
        onAdd: function (map) {
            var controlName = 'zoningButtons',
            container = L.DomUtil.create('div', controlName),
            options = this.options;

            this.zoningOffButton = this._createButton(options.zoningOffText, options.zoningOffTitle, 'button', container, this._zoningOff);
            
            return container;
        },

        _zoningOff: function(e){
            if (map.hasLayer(zoningLayer)== true){
                zoningLayer.remove(map);
            }
            else {
                zoningLayer.addTo(map);
            }
        },
        _createButton: function (html, title, className, container, fn){
            var link = L.DomUtil.create('a', className, container);
            link.innerHTML = html;
            link.href = '#';
            link.title = title;

            L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.stop)
                .on(link, 'click', fn, this)

            return link;
        }
    });

    var ZoningButtons = new L.Control.ZoningButtons();
    
    ZoningButtons.addTo(map);

    map.on('click', function (e) {
        $(".HideUnhide").show();
        $("#PrintBtn").show();
        document.getElementById("addr").value = "";
        if (typeof (new_event_marker) === 'undefined') {
            new_event_marker = new L.marker(e.latlng, { draggable: true });
            new_event_marker.addTo(map);
            if (typeof (drawPoly) != 'undefined'){
                drawPoly.remove(map);
            }
        }
        else {
            new_event_marker.setLatLng(e.latlng);
            if (typeof (drawPoly) != 'undefined'){
                drawPoly.remove(map);
            }
        }
        lats = e.latlng.lat;
        lons = e.latlng.lng;
        coordinates = L.latLng(lats, lons);
        getZoningInfo(coordinates);      
    });
    
    map.on('moveend', function () {
        map.invalidateSize();
    });
    
    document.getElementById("btnSearch").addEventListener("click", addr_search);
});
