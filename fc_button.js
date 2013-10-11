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
  '#fcButton:hover {right: -8px;}' +
  '.worst {border-width:1px; border-style:solid; border-color:#330000;}' +
  '.bad {border-width:1px; border-style:solid; border-color:#660033;}' +
  '.average {border-width:1px; border-style:solid; border-color:#663399;}' +
  '.good {border-width:1px; border-style:solid; border-color:#3399FF;}' +
  '.best {border-width:1px; border-style:solid; border-color:#00FFFF;}'
  )
  .appendTo('head');

function getBuildingTooltip(purchaseRec) {
  var parent = $('<div />').attr('style','min-width:300px;');
  parent.append($('<div />').addClass('price').attr('style', 'float:right;').text(Beautify(purchaseRec.purchase.price)));
  parent.append($('<div />').addClass('name').text(purchaseRec.purchase.name));
  parent.append($('<div />').attr('style', 'font-size:80%;').text('[owned: ' + purchaseRec.purchase.amount + ']'));
  parent.append($('<div />').addClass('description').html(purchaseRec.purchase.desc));
  if (purchaseRec.delta_cps) {
    parent.append($('<div />').addClass('fc_cps').html('&#916; CPS: ' + Beautify(purchaseRec.delta_cps)));
    parent.append($('<div />').addClass('fc_efficiency').text('Efficiency: ' + (Math.floor(purchaseRec.efficiencyScore * 10000) / 100).toString() + '%'));
    parent.append($('<div />').addClass('fc_build_time').text('Build time: ' + timeDisplay(divCps((purchaseRec.cost + delayAmount()), Game.cookiesPs))));
    parent.append($('<div />').addClass('fc_effective_build_time').text('Estimated GC Build time: ' + timeDisplay(divCps((purchaseRec.cost + delayAmount()), (baseCps() + gcPs(weightedCookieValue(true)))))));
  }
  return parent[0].outerHTML;
}

function getUpgradeTooltip(purchaseRec) {
  var parent = $('<div />').attr('style','min-width:300px;');
  parent.append($('<div />').addClass('price').attr('style', 'float:right;').text(Beautify(purchaseRec.purchase.basePrice)));
  parent.append($('<div />').addClass('name').text(purchaseRec.purchase.name));
  parent.append($('<div />').attr('style', 'font-size:80%;').text('[Upgrade]'));
  parent.append($('<div />').addClass('description').html(purchaseRec.purchase.desc));
  if (purchaseRec.delta_cps) {
    parent.append($('<div />').addClass('fc_cps').html('&#916; CPS: ' + Beautify(purchaseRec.delta_cps)));
    parent.append($('<div />').addClass('fc_efficiency').text('Efficiency: ' + (Math.floor(purchaseRec.efficiencyScore * 10000) / 100).toString() + '%'));
    parent.append($('<div />').addClass('fc_build_time').text('Build time: ' + timeDisplay(divCps((purchaseRec.cost + delayAmount()), Game.cookiesPs))));
    parent.append($('<div />').addClass('fc_effective_build_time').text('Estimated GC Build time: ' + timeDisplay(divCps((purchaseRec.cost + delayAmount()), (baseCps() + gcPs(weightedCookieValue(true)))))));
  }
  return parent[0].outerHTML;
}

function colorizeScore(score) {
  var classNames = ['best', 'good', 'average', 'bad', 'worst'];
  var result;
  if (score == 1) {
    result = classNames[0];
  } else if (score > 0.9) {
    result = classNames[1];
  } else if (score > 0.1) {
    result = classNames[2];
  } else if (score > 0) {
    result = classNames[3];
  } else {
    result = classNames[4];
  }
  return result;
}

eval("Game.Draw = " + Game.Draw.toString()
  .replace(/if \(Game.cookies>=me.price\) l\('product'\+me.id\).className='product enabled'; else l\('product'\+me.id\).className='product disabled';/, '(Game.cookies >= me.price) ? $("#product"+me.id).addClass("enabled").removeClass("disabled") : $("#product"+me.id).addClass("disabled").removeClass("enabled");')
  .replace(/if \(Game.cookies>=me.basePrice\) l\('upgrade'\+i\).className='crate upgrade enabled'; else l\('upgrade'\+i\).className='crate upgrade disabled';/, '(Game.cookies >= me.basePrice) ? $("#upgrade"+me.id).addClass("enabled").removeClass("disabled") : $("#upgrade"+me.id).addClass("disabled").removeClass("enabled");'));

function rebuildStore(recalculate) {
  var store = $('#products');
  store[0].innerHTML = '';
  var recommendations = recommendationList(recalculate);
  Game.ObjectsById.forEach(function(me) {
    var purchaseRec = recommendations.filter(function(a) {return a.id == me.id && a.type == 'building';})[0];
    var button = $('<div />')
      .addClass('product')
      .addClass(colorizeScore(purchaseRec.efficiencyScore))
      .mouseenter(function() {Game.tooltip.draw(this, escape(getBuildingTooltip(purchaseRec)), 0, 0, 'left')})
      .mouseleave(function() {Game.tooltip.hide()})
      .click(function() {Game.ObjectsById[me.id].buy()})
      .attr('id', 'product' + me.id);
    button.append($('<div />').addClass('icon').attr('style', 'background-image:url(img/' + me.icon + '.png);'));
    var content = $('<div />').addClass('content');
    content.append($('<div />').addClass('title').html(me.displayName));
    content.append($('<div />').addClass('price').text(Beautify(me.price)));
    if (me.amount) {
      content.append($('<div />').addClass('title').addClass('owned').text(Beautify(me.amount)));
    }
    button.append(content);
    store.append(button);
  });
  Game.Draw();
}

function rebuildUpgrades(recalculate) {
  var store = $('#upgrades');
  store[0].innerHTML = '';
  var recommendations = recommendationList(recalculate);
  Game.UpgradesInStore = Game.UpgradesById.filter(function(a){return !a.bought && a.unlocked;}).sort(function(a,b){return a.basePrice - b.basePrice;});
  Game.UpgradesInStore.forEach(function(me) {
    var purchaseRec = recommendations.filter(function(a) {return a.id == me.id && a.type == 'upgrade';})[0];
    if (!purchaseRec) {
      console.log(me.name + ' not found in recommendationList()');
    } else {
      store.append($('<div />')
        .addClass('crate')
        .addClass('upgrade')
        .addClass(colorizeScore(purchaseRec.efficiencyScore))
        .mouseenter(function() {Game.tooltip.draw(this, escape(getUpgradeTooltip(purchaseRec)), 0, 16, 'bottom-right')})
        .mouseleave(function() {Game.tooltip.hide()})
        .click(function() {Game.UpgradesById[me.id].buy()})
        .attr('id', 'upgrade' + me.id)
        .attr('style', 'background-position:' + (-me.icon[0] * 48 + 6) + 'px ' + (-me.icon[1] * 48 + 6) + 'px;'));
    }
  });
  Game.Draw();
}

Game.RebuildStore=function(recalculate) {rebuildStore(recalculate);}
Game.RebuildUpgrades=function(recalculate) {rebuildUpgrades(recalculate);}

Game.RebuildStore(true);
Game.RebuildUpgrades(true);

Game.oldUpdateMenu = Game.UpdateMenu;

function drawCircles(t_d, canvas) {
  /*c = canvas.jCanvas({
    x: 50, y:50,
    radius: 40
  });*/
  var c = canvas;
  var heightOffset = 45 - (15 * (t_d.length - 1) / 2)
  var i_c = 0;
  var i_tc = 0;
  var t_b = ['#AAA','#BBB','#CCC','#DDD','#EEE','#FFF'];
  var maxWidth = Math.max.apply(null,t_d.map(function(o){return (o.name && o.display) ? c.measureText({fontSize: "12px", fontFamily: "Arial", maxWidth:c.width, text: o.name + ': ' + o.display}).width : 250;}));
  var maxHeight = t_d.map(function(o){return (o.name && o.display) ? c.measureText({fontSize: "12px", fontFamily: "Arial", maxWidth:c.width, text: o.name + ': ' + o.display}).height : 250;})
                     .reduce(function(sum,item){return sum+item;},0);
  c.drawRect({
    fillStyle: '#999',
    x: 215, y: 35-t_d.length*15,
    width: maxWidth + 10, height: maxHeight + 10,
    fromCenter: false
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
        fontSize: "12px",
        fontFamily: "Arial",
        fillStyle: o_draw.c1,
        x: 225+s_t.length, y: heightOffset+15*i_tc,
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
        subsection.append($('<div />').addClass('listing').html('<b>Time til Chain completion:</b> ' + timeDisplay(chain_recommend.cost)));
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
      subsection.append($('<div />').addClass('listing').html('<b>Total Recorded Frenzy Time:</b> ' + timeDisplay(FrozenCookies.gc_time/1000)));
      subsection.append($('<div />').addClass('listing').html('<b>Total Recorded Non-Frenzy Time:</b> ' + timeDisplay(FrozenCookies.non_gc_time/1000)));
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
        subsection.append($('<div />').addClass('listing').html('<b>Time since last HC:</b> ' + timeDisplay((Date.now() - FrozenCookies.lastHCTime)/1000)));
        if (FrozenCookies.lastHCAmount - 1 >= currHC) {
          subsection.append($('<div />').addClass('listing').html('<b>Time to get last HC:</b> ' + timeDisplay((FrozenCookies.lastHCTime - FrozenCookies.prevLastHCTime)/1000)));
        }
        if (FrozenCookies.maxHCPercent > 0) {
          subsection.append($('<div />').addClass('listing').html('<b>Max HC Gain/hr:</b> ' + Beautify(FrozenCookies.maxHCPercent)));
        }
        subsection.append($('<div />').addClass('listing').html('<b>Average HC Gain/hr:</b> ' + Beautify(60 * 60 * (FrozenCookies.lastHCAmount - currHC)/((FrozenCookies.lastHCTime - Game.startDate)/1000))));
        if (FrozenCookies.lastHCAmount - 1 >= currHC) {
          subsection.append($('<div />').addClass('listing').html('<b>Previous Average HC Gain/hr:</b> ' + Beautify(60 * 60 *(FrozenCookies.lastHCAmount - 1 - currHC)/((FrozenCookies.prevLastHCTime - Game.startDate)/1000))));
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
      listing.append($(Game.WriteButton('autoBuy','autobuyButton','Autobuy ON','Autobuy OFF',"toggleFrozen('autoBuy');")));
      listing.append($(Game.WriteButton('autoGC','autogcButton','Autoclick GC ON','Autoclick GC OFF',"toggleFrozen('autoGC');")));
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
