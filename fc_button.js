$('#logButton').before(
  $('<div id="fcButton" />').addClass('button')
    .html('Frozen Cookie')
    .click(function(){
      Game.ShowMenu('fc_menu');
    })
);

$('<style type="text/css">')
  .html(
  '#fcButton {font-size: 60%; top: 0px; right: -16px; padding: 14px 16px 10px 0px;}' +
  '#fcButton:hover {right: -8px;}')
  .appendTo('head');

Game.oldUpdateMenu = Game.UpdateMenu;

function drawCircles(t_d, canvas) {
  /*c = canvas.jCanvas({
    x: 50, y:50,
    radius: 40
  });*/
  var c = canvas;
  var i_c = 0;
  var i_tc = 0;
  var t_b = ['#AAA','#BBB','#CCC','#DDD','#EEE','#FFF'];
  c.drawRect({
    fillStyle: '#999',
    x: 225, y: 12.5+t_d.length/2*15,
    width: 250, height: 5+t_d.length*15
  });
  t_d.forEach( function(o_draw) {
    if (o_draw.overlay)
    {
      i_c--;
    }
    else
    {
      c.drawArc({
        strokeStyle: t_b[i_c],
        strokeWidth: 10,
        x: 45, y:45,
        radius: 40-i_c*10,
      });
      c.drawArc({
        strokeStyle: t_b[i_c+2],
        strokeWidth: 1,
        x: 45, y:45,
        radius: 35-i_c*10
      });
    }
    c.drawArc({
      strokeStyle: o_draw.c1,
      x: 45, y:45,
      strokeWidth: 7,
      start: 0,
      radius: 40-i_c*10,
      end: (360 * o_draw.f_percent)
    });
    if (o_draw.name && o_draw.display)
    {
      var s_t = o_draw.name+": "+o_draw.display;
      c.drawText({
        font: "10px Arial",
        fillStyle: o_draw.c1,
        x: 200+s_t.length, y: 20+15*i_tc,
        text: s_t
      });   
    }
    i_c++;
    i_tc++;
  });
}

function updateTimers() {
  var gc_delay = Game.goldenCookie.delay / maxCookieTime();
  var frenzy_delay = Game.frenzy / maxCookieTime();
  var click_frenzy_delay = Game.clickFrenzy / maxCookieTime();
  var decimal_HC_complete = ((Math.sqrt((Game.cookiesEarned + Game.cookiesReset)/0.5e12+0.25)-0.5)%1);
  var t_draw = [];
  if (gc_delay>0) {
    t_draw.push({
      f_percent: gc_delay,
      c1: "gold",
      name: "Golden Cookie Time",
      display: timeDisplay(Game.goldenCookie.delay/Game.fps)
    });
  }
  if (frenzy_delay>0) {
    t_draw.push({
      f_percent: frenzy_delay,
      c1: "red",
      name: "Frenzy Time",
      display: timeDisplay(Game.frenzy/Game.fps)
    });
  }
  if (click_frenzy_delay>0) {
    t_draw.push({
      f_percent: click_frenzy_delay,
      c1: "#00C4FF",
      name: "Click Frenzy Time",
      display: timeDisplay(Game.clickFrenzy/Game.fps)
    });
  }
  if (decimal_HC_complete>0) {
    t_draw.push({
      f_percent: decimal_HC_complete,
      c1: "#000",
      name: "HC Completion",
      display: (Math.round(decimal_HC_complete*10000)/100)+"%"
    });
  }
  drawCircles(t_draw, $('#fcTimer'));
}

function updateBuyTimers() {
  var bankTotal = delayAmount();
  var purchaseTotal = nextPurchase().cost;
  var chainTotal = nextChainedPurchase().cost;
  var bankCompletion = bankTotal ? (Math.min(Game.cookies, bankTotal)) / bankTotal : 0;
  var purchaseCompletion = Game.cookies/(bankTotal + purchaseTotal);
  var bankPurchaseCompletion = bankTotal/(bankTotal + purchaseTotal);
  var chainCompletion = Math.max(Game.cookies - bankTotal, 0) / (bankTotal + chainTotal);
  var bankPercent = Math.min(Game.cookies, bankTotal) / (bankTotal + purchaseTotal);
  var purchasePercent = purchaseTotal / (purchaseTotal + bankTotal);
  
  var t_draw = [];
  if (bankTotal > 0) {
    t_draw.push({
      f_percent: bankCompletion,
      c1: '#555',
      name: "Golden Cookie Bank",
      display: timeDisplay(divCps(Math.max(bankTotal - Game.cookies,0), Game.cookiesPs))
    });
  }
  if (chainTotal - purchaseTotal > 0) {
    t_draw.push({
      f_percent: chainCompletion,
      c1: '#333',
      name: "Chain Completion Time",
      display: timeDisplay(divCps(Math.max(chainTotal + bankTotal - Game.cookies,0), Game.cookiesPs))
    });
  }
  if (purchaseTotal > 0) {
    t_draw.push({
      f_percent: purchaseCompletion,
      c1: '#111',
      name: "Purchase Completion Time",
      display: timeDisplay(divCps(Math.max(purchaseTotal + bankTotal - Game.cookies,0), Game.cookiesPs))
    });
  }
  if (bankPercent > 0) {
    t_draw.push({
      f_percent: bankPercent,
      c1: 'red',
      name: "Bank Percent",
      display: Math.round(bankPercent*10000)/100+'%',
      overlay: true
    });
  }
  drawCircles(t_draw, $('#fcBuyTimer'));
}

function FCMenu() {
  Game.UpdateMenu = function() {
    if (Game.onMenu !== 'fc_menu') {
      return Game.oldUpdateMenu();
    } else {
      var menu = $('#menu').html('');
      menu.append($('<div />').addClass('section').html('Frozen Cookie'));
      var subsection = $('<div />').addClass('subsection');
      subsection.append($('<div />').addClass('title').html('Game Timers'));
      var timers = $('<canvas id="fcTimer" width="400px" height="100px"/>').html('Your browser does not support the HTML5 canvas tag.');
      subsection.append($('<div />').addClass('listing').append(timers));
      menu.append(subsection);
      updateTimers();
      if (Game.cookiesPs > 0) {
        var timers = $('<canvas id="fcBuyTimer" width="400px" height="100px"/>').html('Your browser does not support the HTML5 canvas tag.');
        subsection.append($('<div />').addClass('listing').append(timers));
        menu.append(subsection);
        updateBuyTimers();
      }
      var subsection = $('<div />').addClass('subsection');
      subsection.append($('<div />').addClass('title').html('Autobuy Information'));
      var recommendation = nextPurchase();
      var store = (recommendation.type == 'building') ? Game.ObjectsById : Game.UpgradesById;
      var purchase = store[recommendation.id];
      var chain_recommend = recommendationList()[0];
      var chain_store = null;
      subsection.append($('<div />').addClass('listing').html('<b>Next Purchase:</b> ' + purchase.name));
      if (!(recommendation.id == chain_recommend.id && recommendation.type == chain_recommend.type)) {
        chain_store = (chain_recommend.type == 'building') ? Game.ObjectsById : Game.UpgradesById;
        subsection.append($('<div />').addClass('listing').html('<b>Building Chain to:</b> ' + chain_store[chain_recommend.id].name));
      }
      subsection.append($('<div />').addClass('listing').html('<b>Time til Completion:</b> ' + timeDisplay(divCps((recommendation.cost + delayAmount() - Game.cookies), Game.cookiesPs))));
      if (!(recommendation.id == chain_recommend.id && recommendation.type == chain_recommend.type)) {
        subsection.append($('<div />').addClass('listing').html('<b>Time til Chain Completion:</b> ' + timeDisplay(divCps(chain_recommend.cost + delayAmount() - Game.cookies, Game.cookiesPs))));
      }
      subsection.append($('<div />').addClass('listing').html('<b>Cost:</b> ' + Beautify(recommendation.cost)));
      subsection.append($('<div />').addClass('listing').html('<b>Golden Cookie Bank:</b> ' + Beautify(delayAmount())));
      subsection.append($('<div />').addClass('listing').html('<b>Base &#916; CPS:</b> ' + Beautify(recommendation.base_delta_cps)));
      subsection.append($('<div />').addClass('listing').html('<b>Full &#916; CPS:</b> ' + Beautify(recommendation.delta_cps)));
      subsection.append($('<div />').addClass('listing').html('<b>Purchase Efficiency:</b> ' + Beautify(recommendation.efficiency)));
      if (!(recommendation.id == chain_recommend.id && recommendation.type == chain_recommend.type)) {
        subsection.append($('<div />').addClass('listing').html('<b>Chain Efficiency:</b> ' + Beautify(chain_recommend.efficiency)));
      }
      if (Game.cookiesPs > 0) {
        subsection.append($('<div />').addClass('listing').html('<b>Golden Cookie Efficiency:</b> ' + Beautify(gcEfficiency())));
      }
      menu.append(subsection);
      var subsection = $('<div />').addClass('subsection');
      subsection.append($('<div />').addClass('title').html('Golden Cookie Information'));
      var isMaxed = weightedCookieValue(true) == weightedCookieValue();
      var maxTxt = isMaxed ? ' (Max)' : '';
      subsection.append($('<div />').addClass('listing').html('<b>Current Average Cookie Value' + maxTxt + ':</b> ' + Beautify(weightedCookieValue(true))));
      if (!isMaxed) {
        subsection.append($('<div />').addClass('listing').html('<b>Max Average Cookie Value:</b> ' + Beautify(weightedCookieValue())));
      }
      subsection.append($('<div />').addClass('listing').html('<b>Max Lucky Cookie Value:</b> ' + Beautify(maxLuckyValue())));
      subsection.append($('<div />').addClass('listing').html('<b>Cookie Bank Required for Max Lucky:</b> ' + Beautify(maxLuckyValue() * 10)));
      if (Game.cookiesPs > 0) {
        subsection.append($('<div />').addClass('listing').html('<b>Estimated Cookie CPS:</b> ' + Beautify(gcPs(weightedCookieValue(true)))));
      }
      subsection.append($('<div />').addClass('listing').html('<b>Golden Cookie Clicks:</b> ' + Beautify(Game.goldenClicks)));
      subsection.append($('<div />').addClass('listing').html('<b>Missed Golden Cookie Clicks:</b> ' + Beautify(Game.missedGoldenClicks)));
      subsection.append($('<div />').addClass('listing').html('<b>Last Golden Cookie Effect:</b> ' + Game.goldenCookie.last));
      subsection.append($('<div />').addClass('listing').html('<b>Total Recorded Frenzy Time:</b> ' + timeDisplay(gc_time/1000)));
      subsection.append($('<div />').addClass('listing').html('<b>Total Recorded Non-Frenzy Time:</b> ' + timeDisplay(non_gc_time/1000)));
      menu.append(subsection);
      var subsection = $('<div />').addClass('subsection');
      subsection.append($('<div />').addClass('title').html('Heavenly Chips Information'));
      var currHC = Game.prestige['Heavenly chips'];
      var resetHC = Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned);
      subsection.append($('<div />').addClass('listing').html('<b>HC Now:</b> ' + Beautify(Game.prestige['Heavenly chips'])));
      subsection.append($('<div />').addClass('listing').html('<b>HC After Reset:</b> ' + Beautify(resetHC)));
      subsection.append($('<div />').addClass('listing').html('<b>Cookies to next HC:</b> ' + Beautify(nextHC(true))));
      subsection.append($('<div />').addClass('listing').html('<b>Estimated time to next HC:</b> ' + nextHC()));
      if (currHC < resetHC) {
        subsection.append($('<div />').addClass('listing').html('<b>Time since last HC:</b> ' + timeDisplay((Date.now()- lastHCTime)/1000)));
        if (lastHCAmount - 1 >= currHC) {
          subsection.append($('<div />').addClass('listing').html('<b>Time to get last HC:</b> ' + timeDisplay((lastHCTime - prevLastHCTime)/1000)));
        }
        subsection.append($('<div />').addClass('listing').html('<b>Average HC Gain/hr:</b> ' + Beautify(60 * 60 * (lastHCAmount - currHC)/((lastHCTime - Game.startDate)/1000))));
        if (lastHCAmount - 1 >= currHC) {
          subsection.append($('<div />').addClass('listing').html('<b>Previous Average HC Gain/hr:</b> ' + Beautify(60 * 60 *(lastHCAmount - 1 - currHC)/((prevLastHCTime - Game.startDate)/1000))));
        }
      }
      menu.append(subsection);
      var subsection = $('<div />').addClass('subsection');
      subsection.append($('<div />').addClass('title').html('Other Information'));
      var cps = baseCps();
      var baseChosen = (Game.frenzy > 0) ? '' : ' (*)';
      var frenzyChosen = (Game.frenzy > 0) ? ' (*)' : '';
      subsection.append($('<div />').addClass('listing').html('<b>Base CPS' + baseChosen + ':</b> ' + Beautify(cps)));
      subsection.append($('<div />').addClass('listing').html('<b>Frenzy CPS' + frenzyChosen + ':</b> ' + Beautify(cps * 7)));
      subsection.append($('<div />').addClass('listing').html('<b>Estimated Effective CPS:</b> ' + Beautify(cps + gcPs(weightedCookieValue(true)))));
      subsection.append($('<div />').addClass('listing').html('<b>Game Started:</b> ' + Game.sayTime((Date.now()-Game.startDate)/1000*Game.fps)));
      menu.append(subsection);
      var subsection = $('<div />').addClass('subsection');
      subsection.append($('<div />').addClass('title').html('Frozen Cookie Controls'));
      var listing = $('<div />').addClass('listing');
      listing.append($(Game.WriteButton('autobuy','autobuyButton','Autobuy ON','Autobuy OFF',"toggleFrozen('autobuy');")));
      listing.append($(Game.WriteButton('autogc','autogcButton','Autoclick GC ON','Autoclick GC OFF',"toggleFrozen('autogc');")));
      listing.append($(Game.WriteButton('nform','nformButton','Million/Milliards','Million/Billion',"toggleFrozen('nform');Game.RebuildStore();Game.RebuildUpgrades();")));
      subsection.append(listing);
      menu.append(subsection);
      var subsection = $('<div />').addClass('subsection');
      subsection.append($('<div />').addClass('title').html('Internal Information'));
      var buildTable = $('<table />').html('<tr><th>Building</th><th>Efficiency</th><th>Cost</th><th>&#916; CPS</th></tr>');
      recommendationList().forEach(function(rec) {
        var store = (rec.type == 'building') ? Game.ObjectsById : Game.UpgradesById;
        var item  = store[rec.id];
        buildTable.append($('<tr><td><b>' + item.name + '</b></td><td>' + Beautify(rec.efficiency) + '</td><td>' + Beautify(rec.cost) + '</td><td>' + Beautify(rec.delta_cps) + '</td></tr>'));
      });
      buildTable.append($('<tr><td><b>Golden Bank</b></td><td>' + Beautify(gcEfficiency()) + '</td><td>' + Beautify(Math.max(0,(maxLuckyValue() * 10 - Game.cookies))) + '</td><td>' + Beautify(gcPs(weightedCookieValue() - weightedCookieValue(true))) + '</td></tr>'));
      subsection.append($('<div />').addClass('listing').append(buildTable));
      menu.append(subsection);
    }
  }
}
