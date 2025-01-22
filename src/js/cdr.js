// require([
//     "esri/Graphic",
//     "esri/symbols/SimpleMarkerSymbol",
//     "esri/geometry/geometryEngine",
//     "esri/geometry/Polygon",
//     "esri/geometry/Point",
//     "esri/layers/GraphicsLayer",
//   ], function(Graphic, SimpleMarkerSymbol, geometryEngine, Polygon, Point, GraphicsLayer) {

import L from 'leaflet';
import { tiledMapLayer } from "esri-leaflet";

export default function(L, tiledMapLayer) {

var map2 = L.map('map2', {zoomControl: false}).setView([39.9525, -75.1637], 15);
tiledMapLayer({
    url: 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer',
}).addTo(map2);

tiledMapLayer({
    url: 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer',
}).addTo(map2);

function zoningStyle(feature){
    if(feature.properties.CODE==="RSA1" || feature.properties.CODE==="RSA2" || feature.properties.CODE==="RSA3" || feature.properties.CODE==="RSA4" || feature.properties.CODE==="RSA5"){
        return{color: '#F8EF67'};
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
        return{color: "#000000"};
    }
}

L.esri.featureLayer({
    url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zoning_BaseDistricts/FeatureServer/0',
    style: zoningStyle,
    weight: 1,
    fillOpacity: 0.6
}).addTo(map2);


function findParcel(place, x, y){
var query_parcel = L.esri.query({
    url: 'http://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PWD_PARCELS/FeatureServer/0'
});
query_parcel.intersects(place); //  Looks up parcel at the lat/long found from AIS search either clicking or address search. The parcel is important for overlays and also looks up the address.
query_parcel.run(function (error, featureCollection, response) {
    //  Overlays can cut through parcels but they are still apply if any part intersects the parcel. If there isn't 
    if (featureCollection.features.length == 0) {
        //  if no parcel exists...
        //  1) Sets html element to inform that it's not in a parcel
        //  2) Queries all overlays that intersect the lat/long of lat/long. The parameters for getOverlays are the lat/long and the zoning at that location
        console.log("This point is not in a parcel");
        getNearbyZoning(place);
    }
    else {
        //  if parcel exists: 
        //  1) find the address from that parcel
        //  2) Create a link for that address's page in atlas to replace generic atlas link in footer and navigation
        //  3) Create a polygon of the parcel and add it to the map
        //  4) Query all overlays that intersect the any part of the parcel. The parameters to getOverlays is the geometry of the polygon and the zoning at that location
        var addy = featureCollection.features[0].properties.ADDRESS
        console.log(addy);
        var polygon = featureCollection.features[0].geometry;
        console.log(polygon);
        polygonArray = [polygon.coordinates]
        console.log(polygonArray[0])
        var parcelPolygon = new Polygon(polygonArray[0])

        console.log(parcelPolygon)

        console.log(place.lat)
        console.log(place.lng)

                
        var newPoint = new Point({
            latitude: place.lat,
            longitude: place.lng,
            spatialReference: map2.spatialReference
        })
        getNearbyZoning(place);

        bufferLayer = new GraphicsLayer();
        //map2.addLayer(bufferLayer)

        var polySym = {
            type: "simple-fill", // autocasts as new SimpleFillSymbol()
            color: [140, 140, 222, 0.5],
            outline: {
              color: [0, 0, 0, 0.5],
              width: 2
            }
          };
  


        //var polyJson = polygon.toJson(polygon)
        //console.log(polyJson)
    //    var realPolygon = new Polygon(polygonArray);
    //    drawPoly = L.geoJSON(polygon).addTo(map2);
    //    console.log(drawPoly)
        console.log("new point: ")
        console.log(newPoint)
        var bufferPolygon = geometryEngine.geodesicBuffer(parcelPolygon, 200, "feet", true)
        console.log(bufferPolygon)

        var sms = bufferPolygon.toJSON()


        
        L.geoJSON(sms).addTo(map2)
    }
});

function showZoningResults(featureSet) {
    resultFeatures = featureSet.features;
    for (var i = 0, il = resultFeatures.length; i < il; i++) {
        zoningCode = resultFeatures[i].properties.LONG_CODE;
        zoningCategory = resultFeatures[i].properties.ZONINGGROUP
        console.log(zoningCode);
        document.getElementById("titleForZoningPanel").innerHTML = "Zoning"
        document.getElementById("baseZoning").innerHTML = zoningCode;
        document.getElementById("zoningGroup").innerHTML = zoningCategory;
    }
}

function getNearbyZoning(spot){
    var query_zoning = L.esri.query({
        url: 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zoning_BaseDistricts/FeatureServer/0'
    });
    //query_zoning.nearby(spot, 61);
    query_zoning.nearby(spot, 0);
    console.log("Hello")
    query_zoning.run(function(error, featureCollection, response){
        console.log("Found " + featureCollection.features.length + " features")
        showZoningResults(featureCollection);
    })

}
}

function chooseAddr(lat1, lng1) {
    if (typeof (new_event_marker) === 'undefined') {
        new_event_marker = new L.marker([lat1, lng1], { draggable: true });
        new_event_marker.addTo(map2);
    }
    else {
        new_event_marker.setLatLng([lat1, lng1]);
    }
    map2.setView([lat1, lng1], 17);
    var coordinates = new L.LatLng(lat1, lng1);
    findParcel(coordinates)
}

function myFunction(arr) {
    var out = "<br />";
    var i;
    if (arr.length > 0) {
        for (i = 0; i < arr.length; i++) {
            out += "<div class='address' title='Show Location and Coordinates' onclick='chooseAddr(" + arr[i].lat + ", " + arr[i].lon + ");return false;'>" + arr[i].display_name + "</div>";
            var coordinates = new L.LatLng(arr[i].lat, arr[i].lon);
            console.log(coordinates);
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
    const requestUrl = `http://api.phila.gov/ais/v1/search/${addressInput.value}?gatekeeperKey=${gatekeeperKey}`;
    $.get(requestUrl, function (result) {
        if (result.features.length > 0) {
            const coordinates = new L.LatLng(result.features[0].geometry.coordinates[1], result.features[0].geometry.coordinates[0]);
            if (typeof (new_event_marker) === 'undefined') {
                new_event_marker = new L.marker(coordinates, { draggable: true });
                new_event_marker.addTo(map2);
                if (typeof (drawPoly) != 'undefined'){
                    drawPoly.remove(map2);
                }    
                map2.flyTo(coordinates, 17);
                findParcel(coordinates);
            }
            else {
                new_event_marker.setLatLng(coordinates);
                if (typeof (drawPoly) != 'undefined'){
                    drawPoly.remove(map2);
                }    
                map2.flyTo(coordinates, 17);
                findParcel(coordinates);
            }
        }
    });
}

map2.on('click', function (e) {
    $(".HideUnhide").show();
    $("#PrintBtn").show();
   document.getElementById("addr").value = "";
    if (typeof (new_event_marker) === 'undefined') {
        new_event_marker = new L.marker(e.latlng, { draggable: true });
        new_event_marker.addTo(map2);
        if (typeof (drawPoly) != 'undefined'){
            drawPoly.remove(map2);
        }
    }
    else {
        new_event_marker.setLatLng(e.latlng);
        if (typeof (drawPoly) != 'undefined'){
            drawPoly.remove(map2);
        }
    }
    lats = e.latlng.lat;
    lons = e.latlng.lng;
    coordinates = L.latLng(lats, lons);
    console.log(coordinates);
    map2.flyTo(coordinates, 17);
    findParcel(coordinates, lats, lons)
});

document.getElementById("btnSearch").addEventListener("click", addr_search);

}


// })