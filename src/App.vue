<script setup>

import Map from './components/Map.vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

console.log('route:', route, 'route.params:', route.params);

</script>

<template>

<Map></Map>
<div id="printHeader">
  <div class="columns">
    <a href="https://www.phila.gov/departments/department-of-planning-and-development/" class="logo">
      <img src="./assets/images/DPD_BELL_logo.jpg" width="360" alt="Dept. of Planning and Development Logo">
    </a>
    <div class="app-divide"></div>
    <div class="page-title-container">
      <h1 class="page-title">Zoning Summary Generator: By-Right Zoning Information</h1>
    </div>
  </div>
</div>
  <div id="application">
    <header class="site-header app group">
      <div class="row expanded">
        <div class="columns">
          <a href="https://www.phila.gov/departments/department-of-planning-and-development/" class="DPDLogo">
            <img src="./assets/images/DPDBELLlogo.png" alt="City of Philadelphia">
          </a>
          <div class="app-divide"></div>
          <div class="page-title-container">
            <h1 class="page-title">Zoning Summary Generator</h1>
            <h2 class="page-subtitle">By-Right Zoning Information</h2>
          </div>
          <div class="app-buttons">
          </div>
        </div>
      </div>
    </header>
    <div class="app-nav">
      <div class="row expanded">
        <div class="columns">
          <nav>
            <ul>
              <li>
                <a href="https://www.phila.gov/media/20190212105254/FINAL-Permit-Checklist_January2019.1-1.pdf" target='_blank'><b>Development Checklist (PDF)</b></a>
              </li>
              <li>
                <a href="https://www.phila.gov/departments/department-of-planning-and-development/development-services/" target='_blank'><b>Development Services</b></a>
              </li>
              <li>
                <element id="atlasNav"><a href="https://atlas.phila.gov"  target='_blank'><b>Additional Property Info</b></a></element>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
    <main>
    </main>

    <div class="app-footer anchor">
      <footer>
        <div class="row expanded">
          <div class="columns">
            <nav>
              <ul class="inline-list">
                <li>
                  <a href="#open-modal">Feedback</a>
                </li>
                <div id="open-modal" class="modal-window">
                  <div>
                    <a href="#" title="Close" class="modal-close"><i class="fa fa-window-close" aria-hidden="true"></i></a>
                    <div>
                      If you have any questions or suggestions for improvements please <a href="mailto:planning.development@phila.gov">let us know</a>!
                    </div>
                  </div>
                </div>
                <li>
                  <a href="terms.html">Terms of Use</a>
                </li>
                <li>
                  <element id="atlasFooter"><a href="https://atlas.phila.gov"  target='_blank'>Atlas</a></element>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  </div>
  <div id="map">
  </div>
  <div id="search">
    <input type="text" name="addr" placeholder="Search the map" aria-label="Search the map" title="Search the map" value="" id="addr" size="58" onkeydown="if (event.keyCode == 13)
    {document.getElementById('btnSearch').click(); return false;}" />
    <button type="button" id="btnSearch" aria-label="Search" title="Search">
      <i class = 'fas fa-search fa-2x' span style='font-size: 18px'></i>
    </button>
    <div id="results"></div>
  </div>
<div id="PrintBtn">
  <button type="button" id="btnPrint" onclick="window.print();return false;">Print</button>
</div>
<div id="zoningInfo">
 <div class="set">
  <div class="row">
    <div class="columns">
      <h1 id="parcelAddress"></h1>
    </div>
  </div>
</div>
<div class="set">
  <div class="row">
    <div>
        <table id="pendingZoningAlert"></table>
      </div>
    <div class="columns">
      <h2 id="baseZoningTitle">To find a property's zoning information, enter the address in the search bar.</h2>
    </div>
  </div>
</div>
  <div class="row">
    <div class="columns"><b id="baseZoning"></b></div>
    <div class="columns">
      <p id="zoningDescription"></p>
    </div>
  </div>
</div>

<div class="HideUnhide">
  <br />
<div class="set">
  <div class="row">
    <div class="columns">
      <h3 id="useRegs"></h3>
    </div>
  </div>
  <div class="row">
    <div class="columns">
      <p><b id="structByRightTitle"></b>
        <element id="structByRight" /> 
      </p>
    </div>
  </div>
  <div class="row">
    <div class="columns">
      <p><b id="UsesByRight"></b>
        <element id="theUsesbyRightAre"></element>
      </p>
    </div>
    <div class="columns">
      <p><b id="theExceptionsTitle"></b>
        <element id="theExceptions"></element>
      </p>
    </div>
    <div class="columns">
      <p id="theUseNote"></p>
    </div>
    <div class="columns">
      <p id="useStarredNote"></p>
    </div>
  </div>
  </div>
  <br />
  <div class="set">
  <div class="row">
    <div class="columns">
      <p>
        <h3 id="multiUseNoteBold"></h3>
        <element id="multiUseNote"></element>
      </p>
    </div>
  </div>
  <div class="row">
    <div class="columns">
    </br>
      <p><b id="acctStructuresLabels"></b>
        <element id="acctStructures"></element><element id="accStructsConds"></element>
      </p>
    </div>
    <div class="columns">
      <p><b id="permAccessUseheader"></b>
        <element id="permAccessUseText"></element>
        <element id="permAccessUseCond"></element>
      </p>
    </div>
  </div>
  </div>
</div>

  <br />
  <div class="set">
    <div class="row">
      <div class="columns">
        <h3 id="dimStandsLabel"></h3>
      </div>
    </div>
    <div class="row">
      <table id="dimTable"></table>
    </div>
  </div>
  <br />

  <div class="set">
    <div class="row">
      <div class="columns">
        <h3 id="parkCodeLabel"></h3>
      </div>
    </div>
    <div class="row">
      <table id="parkTable"></table>
    </div>
  </div>
  <br />

  <div class="set">
    <div class = "row">
      <div class = "columns">
        <h3 id = "signLabel"></h3>
      </div>
    </div>
    <div class = "row">
      <table id = "signTable">
      </table>
    </div>
  </div>
  <br />

  <div class="set">
  <div class="row">
    <div class="columns">
      <p>
        <h3 id="fencelabel"></h3>
      </p>
    </div>
  </div>
  <div class="row">
    <div class="columns">
      <p id="fencedata"></p>
    </div>
  </div>
</div>

<div class="set">
  <div class="row">
    <div class="columns">
      <p>
        <h3 id="otherConcerns"></h3>
      </p>
    </div>
  </div>
  <div class="row">
    <div class="columns">
      <p id="otherConcernDisclaimer"></p>
    </div>
  </div>
</div>

<div class="set">
  <div class="row">
    <div class="columns">
      <h2 id="overlayHeading"></h2>
    </div>
    <div class="columns">
      <p id="overlaySubheading"></p>
    </div>
    <div>
      <table id="pendingOverlayAlert"></table>
    </div>
  </div>
  <div class="row">
    <table id="overlayTable"></table>
  </div>
</div>

<div class="set">
  <div class="row">
    <div class="columns">
      <p>
        <h2 id="historicHeading"></h2>
      </p>
    </div>
  </div>
  <div class="row">
    <div class="columns">
      <p id="historicInfo"></p>
    </div>
  </div>
</div>

<div class="row">
  <div class="columns">
    <p><b></b></p>
  </div>
</div>

<div class="row">
  <div class="columns">
    <p id="Disclosure"></p>
  </div>
</div>
<div class="row">
  <div class="columns">
    <p id="DisclosureP2"></p>
  </div>
</div>
<div class="row">
    <div class="columns">
      <p></p>
    </div>
</div>

</template>

<style scoped>


</style>
