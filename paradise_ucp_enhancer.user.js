// ==UserScript==
// @name         Eitho's Paradise UCP enhancer
// @version      1.32
// @description  Fixes and new functions for https://ucp.paradise-rpg.pl/
// @homepageURL  https://github.com/Eithoo/paradise-ucp-enhancer
// @updateURL    https://github.com/Eithoo/paradise-ucp-enhancer/raw/main/paradise_ucp_enhancer.user.js
// @downloadURL  https://github.com/Eithoo/paradise-ucp-enhancer/raw/main/paradise_ucp_enhancer.user.js
// @supportURL   https://github.com/Eithoo/paradise-ucp-enhancer/issues
// @connect      *
// @icon         https://i.imgur.com/gJ9fUg0.png
// @author       Eitho
// @match        https://ucp.paradise-rpg.pl
// @match        https://ucp.paradise-rpg.pl/profile/*
// @match        https://ucp.paradise-rpg.pl/vehicle/*
// @match        https://ucp.paradise-rpg.pl/group/*
// @grant        GM.xmlHttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @require      https://raw.githubusercontent.com/marcelodolza/iziToast/master/dist/js/iziToast.min.js
// @require      https://rawgit.com/kimmobrunfeldt/progressbar.js/1.0.0/dist/progressbar.js
// @run-at       document-end
// ==/UserScript==

(function() {
	'use strict';

	/*
	
		.----------------. .----------------. .----------------. .----------------. .----------------. 
		| .--------------. | .--------------. | .--------------. | .--------------. | .--------------. |
		| |  _________   | | |     _____    | | |  _________   | | |  ____  ____  | | |    ______    | |
		| | |_   ___  |  | | |    |_   _|   | | | |  _   _  |  | | | |_   ||   _| | | |   /      \   | |
		| |   | |_  \_|  | | |      | |     | | | |_/ | | \_|  | | |   | |__| |   | | |  /  .--.  \  | |
		| |   |  _|  _   | | |      | |     | | |     | |      | | |   |  __  |   | | |  | |    | |  | |
		| |  _| |___/ |  | | |     _| |_    | | |    _| |_     | | |  _| |  | |_  | | |  \  `--'  /  | |
		| | |_________|  | | |    |_____|   | | |   |_____|    | | | |____||____| | | |   \______/   | |
		| |              | | |              | | |              | | |              | | |              | |
		| '--------------' | '--------------' | '--------------' | '--------------' | '--------------' |
		'----------------' '----------------' '----------------' '----------------' '----------------' 
	
	*/
	console.log("%c❰❰ Eitho's ❱❱ \nParadise UCP enhancer", 'background-color: #ccc; color: white; text-shadow: 2px 2px 4px #000000; font-size: 4em; text-align: center;');

	const urls = {
		main: 'https://ucp.paradise-rpg.pl',
		profile: 'https://ucp.paradise-rpg.pl/profile/',
		group: 'https://ucp.paradise-rpg.pl/group/',
		vehicle: 'https://ucp.paradise-rpg.pl/vehicle/',
		signature: 'https://ucp.paradise-rpg.pl/public/signatures/',
		api: {
			blips: 'https://ucp.paradise-rpg.pl/houses/blips',
			houses: 'https://ucp.paradise-rpg.pl/houses/houses',
			tenants: 'https://ucp.paradise-rpg.pl/houses/tenants',
			zones: 'https://ucp.paradise-rpg.pl/houses/zones',
			top: {
				lvl: 'https://ucp.paradise-rpg.pl/api/lvlTop',
				hours: 'https://ucp.paradise-rpg.pl/api/hoursTop'
			}
		}
	};

	async function addIziToast(){
		const style = await getPage('https://raw.github.com/marcelodolza/iziToast/master/dist/css/iziToast.min.css', true);
		GM_addStyle(style);
		iziToast.settings({
			timeout: 15000,
			closeOnEscape: true
		});
	}


	function getHexColor(string){
		return string.match(/#[0-9a-f]{6}|#[0-9a-f]{3}/gi) || false;
	}

	function removeHex(string){
		return string.replace(/#[a-f0-9]{6}/ig, '');
	}


	function dump(obj, indent) {
		var result = "";
		if (indent == null) indent = "";
		for (var property in obj) {
			var value = obj[property];
			if (typeof value == 'string') value = "'" + value + "'";
			else if (typeof value == 'object') {
				if (value instanceof Array) {
					value = "[ " + value + " ]";
				} else {
					var od = dump(value, indent + "\t");
					value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
				}
			}
			result += indent + "'" + property + "' : " + value + ",\n";
		}
		return result.replace(/,\n$/, "");
	}

	Element.prototype.appendBefore = function(element) {
		element.parentNode.insertBefore(this, element);
	}, false;
	  
	Element.prototype.appendAfter = function(element) {
		element.parentNode.insertBefore(this, element.nextSibling);
	}, false;

	function cfDecodeEmail(encodedString) { // Author: Ruri (https://forum.openbullet.dev/topic/29/parsing-cloudflare-protected-emails)
		var email = "", r = parseInt(encodedString.substr(0, 2), 16), n, i;
		for (n = 2; encodedString.length - n; n += 2){
			i = parseInt(encodedString.substr(n, 2), 16) ^ r;
			email += String.fromCharCode(i);
		}
		return email;
	}

	function getPage(url, dontparse, method) {
		return new Promise(function (resolve, reject) {
			GM.xmlHttpRequest({
				method: method || 'GET',
				timeout: 1000*10,
				url: url,
				onload: function(response) {
					if (dontparse == 'returnall') resolve(response);
					else if (dontparse && dontparse != 'returnall') resolve(response.responseText);
					else {
						var page = new DOMParser().parseFromString(response.responseText, 'text/html');
						const nicksWithEmails = page.querySelectorAll('.__cf_email__'); // fix for [email protected]
						if (nicksWithEmails) {
							for (const element of nicksWithEmails) {
								const string = element.getAttribute('data-cfemail');
								const nick = cfDecodeEmail(string);
								element.innerText = nick;
							}
						}
						resolve(page);
					}
				},
				onerror: function(error){
					reject(error);
				},
				ontimeout: function(error){
					reject(error);
				}
			});
		});
	}

	function success(title, text, position, id){
		iziToast.success( {title, message: text || '', position: position || 'bottomRight', id: id || null });
	}
	function error(title, text, position, id){
		iziToast.error({ title, message: text || '', position: position || 'bottomRight', id: id || null });
	}
	function info(title, text, timeout, position, id){
		iziToast.info({ title, message: text || '', timeout: timeout || 15000, position: position || 'bottomRight', id: id || null });
	}

	let user = {};
	// user.name user.id

	function isUserLoggedIn(){
		// TODO
	}

	async function getUser(){
		const userFromMemory = localStorage.user;
		if (userFromMemory) {
			user = JSON.parse(userFromMemory);
			return user;
		}
		const profile = document.querySelector('li.nav-item ul li a');
		if (!profile) {
			user = false;
			return false;
		};
		const ID = profile.href.split('/').slice(-1)[0];
		user.ID = ID;
		const userPage = await getPage(urls.profile + ID);
		const username = userPage.querySelector('.group_name').innerText.trim();
		user.name = username;
		localStorage.user = JSON.stringify(user);
		return user;
	}


	function addColorToRanks(){
		var members = document.querySelectorAll('#tableMembers tbody tr');
		for (var elem of members){
			var data = elem.querySelectorAll('th');
			var rank = data[1];
			if (!getHexColor(rank.innerText)) continue;
			rank.innerHTML = rank.innerText.replace(/(#.{6})([^#]*)/g, '<span style="color: $1; font-weight: bold;">$2</span>');
		}
	}

	async function getLastDrivers(ID) {
		if (!ID) return false;
		const page = await getPage(urls.vehicle + ID);
		let lastDrivers = [];
		var drivers = page.querySelectorAll('#tab_lastDrivers tbody tr');
		for (var elem of drivers) {
			var data = elem.querySelectorAll('th');
			const UID = + data[1].querySelector('a').href.replace('https://ucp.paradise-rpg.pl/profile/', '');
			const nick = data[1].innerText.trim();
			const time = data[2].innerText.trim();
			lastDrivers.push(`(UID ${UID}) ${nick}: ${time}`);
		}
		if (lastDrivers.length < 1) return false;
		lastDrivers = lastDrivers.slice(-5);
		return lastDrivers;
	}

	function prepareLastDrivers(pageType) { // tworzenie przyciskow
		if (!pageType) pageType = 'group';
		const selector = pageType == 'group' ? '#tableCars' : 'div#tab_cars table';
		var headers = document.querySelectorAll(selector + ' thead tr th');
		if (headers[4].innerText != 'dodatek') {
			var newHeader = document.createElement('th');
			newHeader.scope = 'col';
			newHeader.style = 'width: 0px';
			newHeader.innerText = 'dodatek';
			newHeader.appendAfter(headers[3]);
		}
		var vehicles = document.querySelectorAll(selector + ' tbody tr');
		for (var elem of vehicles){
			var data = elem.querySelectorAll('th');
			if (data.length == 0) return; // = brak danych
			if (data[4].innerText == 'Ostatni kierowcy') continue;
			const ID = data[0].innerText.trim();
			const name = data[2].innerText.trim();
			const image = data[1].querySelector('img').src;
			var button = document.createElement('button');
			button.className = 'btn btn-primary shadow_box active text-right';
			button.innerText = 'Ostatni kierowcy';
			button.onclick = async () => {
				info('Czekaj..', `Sprawdzanie ostatnich kierowców pojazdu <b>${ID}</b>`, 10000, undefined, 'temporary');
				const drivers = await getLastDrivers(ID);
				var previous = document.getElementById('temporary');
				iziToast.hide({}, previous);
				if (!drivers) error('Błąd', 'Wystąpił błąd i nie można było pobrać ostatnich kierowców tego pojazdu.');
				else {
					iziToast.show({
						theme: 'dark',
						icon: 'icon-contacts',
						title: 'Ostatni kierowcy ' + name,
						message: `Lista została skopiowana do schowka:<br>${drivers.join('<br>')}`,
						displayMode: 2,
						position: 'center',
						transitionIn: 'flipInX',
						transitionOut: 'flipOutX',
						progressBarColor: 'rgb(0, 255, 184)',
						image: image,
						imageWidth: 256,
						layout: 2,
						titleSize: '2em',
						titleLineHeight: '150%'
					});
				//	success('Kierowcy', `Lista została skopiowana do schowka:<br>${drivers.join('<br>')}`);
					GM_setClipboard(`Ostatni kierowcy pojazdu ${name} ${ID}:\r\n${drivers.join('\r\n')}`);
				}
			}
			var th = document.createElement('th');
			th.appendChild(button);
			th.appendAfter(data[3]);
		}
	}

	function isSignatureTabActive(){
		var someButton = document.querySelector('button.btn.btn-primary.shadow_box.tablinks.active');
		if (!someButton) return false;
		if (someButton.innerText != 'Sygnatura') return false;
		return true;
	}

	async function checkIfSignatureExists(ID){
		const request = await getPage(urls.signature + ID + '.png', 'returnall', 'HEAD')
		.catch(error => false);
		if (!request) return false;
		console.log(request);
		const headers = request.responseHeaders;
		if (request.status == 200 && headers.includes('content-type: image/png')) return true;
		return false;
	}

	let signaturePageChanged = false;
	async function prepareSignature(){
		if (!isSignatureTabActive()) return;
		if (signaturePageChanged) return; // jesli juz ta funkcja byla wykonana
		const ID = window.location.pathname.split('/').slice(-1)[0];
		if (user && (user.ID == ID)) return; // jeśli jest zalogowany i przegląda swoje konto, to nie ma potrzeby zmieniac tam

		var place = document.querySelector('div#tab_signature div.card-body');
		if (!place) return;
		place.innerHTML = null;
		signaturePageChanged = true;

		if (! await checkIfSignatureExists(+ID)){
			var image = document.createElement('img');
			image.src = 'https://i.imgur.com/GjbFKBc.png';
			image.className = 'img-fluid';
			var text = document.createElement('h5');
			text.style = 'margin-top: 1em';
			text.innerHTML = 'Ten gracz nie wygenerował jeszcze swojej sygnatury.<br>Nie ma możliwości jej zobaczenia.';
			place.appendChild(image);
			place.appendChild(text);
			return;
		}

		var image = document.createElement('img');
		image.src = urls.signature + ID + '.png';
		image.className = 'img-fluid';

		var imageText = document.createElement('small');
		imageText.className = 'text-white-50';
		imageText.style = 'margin-top: 0.5em; display: block;';
		imageText.innerText = 'Sygnatury odświeżają się co godzinę.';

		var links = document.createElement('div');
		links.className = 'card-body shadow_box';
		links.style = 'margin-top: 2em';
		links.innerHTML = `
			<h5>Linki do sygnatury</h5>
			<small style='display: block; text-align: left;'>Link bezpośredni:</small>
			<input class="form-control_login shadow_box" style='color: 9c9c9c;' type="text" value="https://ucp.paradise-rpg.pl/public/signatures/${ID}.png" readonly>
			<br>
			<small style='display: block; text-align: left;'>BBCode:</small>
			<input class="form-control_login shadow_box" style='color: 9c9c9c;' type="text" value="[img]https://ucp.paradise-rpg.pl/public/signatures/${ID}.png[/img]" readonly>
			<br>
			<small style='display: block; text-align: left;'>HTML:</small>
			<input class="form-control_login shadow_box" style='color: 9c9c9c;' type="text" value="<img src='https://ucp.paradise-rpg.pl/public/signatures/6322.png'>" readonly>
		`;
		place.appendChild(image);
		place.appendChild(imageText);
		place.appendChild(links);
	}

	async function getGroupsList(t, onlyIDs){
		if (!t) t = 'all';
		const types = {
			frakcje: 0,
			gangi: 1,
			cywilne: 2,
			all: true
		};
		const type = t in types ? types[t] : 2;
		if (localStorage.groupsList){
			let groupsList = JSON.parse(localStorage.groupsList);
			if (type !== true)
				groupsList = groupsList.filter(group => group.type == t);
			if (onlyIDs) {
				groupsList = groupsList.map(group => group.ID);
			}
			return groupsList;
		}
		const page = await getPage(urls.main);
	//	const groups = type == true ? page.querySelectorAll('.row') : [page.querySelectorAll('.row')[type]];
		const groups =  page.querySelectorAll('.row');
		const getGroupID = group => {return +(group.querySelector('a.avatar').href).split('/').slice(-1)[0]};
		const getGroupName = group => {return group.querySelector('.group_fullname').textContent};
		const getGroupShortName = group => {return group.querySelector('.group_name').textContent};
		const getGroupImage = group => {
			let path = group.querySelector('div.group_logo img').outerHTML.match(/data-src=\"([^']*?)\"/)[1];
			if (path.includes('./public/img/ustawkurwalogoxd.png')) path = urls.main + '/' + path;
			return path;
		};
		let groupsList = [];
		let allGroupsList = [];
		for (const categoryID in groups){
			const category = !isNaN(categoryID) ? groups[categoryID] : false;
			if (!category) continue;
			for (const group of category.querySelectorAll('.group_info')){
				const data = {
					ID: getGroupID(group),
					name: getGroupName(group),
					shortname: getGroupShortName(group),
					image: getGroupImage(group),
					type: Object.keys(types).find(key => types[key] == categoryID)
				};
				if (type !== true && categoryID != type) { // nieprawidlowa kategoria
					allGroupsList.push(data);
					continue;
				}
				if (onlyIDs) {
					groupsList.push(getGroupID(group));
					allGroupsList.push(data);
					continue;
				}
				groupsList.push(data);
				allGroupsList.push(data);
			}
		}
		localStorage.groupsList = JSON.stringify(allGroupsList);
		return groupsList;
	}

	function rgbToHex(r, g, b) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}

	function removeHex(string){
		return string.replace(/#[a-f0-9]{6}/ig, '');
	}

	async function getGroupDetails(ID){
		if (!ID) return false;
		const page = await getPage(urls.group + ID);
		if (!page) return false;
		let response = {ID: +ID};
		const name = page.querySelector('.card-body h3');
		if (!name) return false;
		response.name = name.innerHTML;
		const colorCSS = page.querySelector('.group_infobox_icon').style.color;
		const color = colorCSS.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
		response.color = rgbToHex(+color[1], +color[2], +color[3]);
		const image = page.querySelector('.rounded').src;
		response.image = image.includes('/public/img/ustawkurwalogoxd.png') ? false : image;
		const boxes = page.querySelectorAll('.group_infobox div b');
		response.type = boxes[0].innerHTML;
		response.tag = boxes[1].innerHTML;
		response.leader = boxes[2].innerHTML;
		if (response.type == 'Frakcja')
			response.memberCount = +boxes[3].innerHTML;
		else {
			response.level = +boxes[3].innerHTML;
			response.respect = +boxes[4].innerHTML;
			response.memberCount = +boxes[5].innerHTML;
		}
		let members = [];
		const membersTable = page.querySelectorAll('#tableMembers tbody tr');
		for (const elem of membersTable){
			const data = elem.querySelectorAll('th');
			let memberArray = {
				nick: data[0].textContent.trim(),
				ID: +data[0].querySelector('a').href.split('/').slice(-1)[0],
				rank: data[1].textContent.trim(),
				cleanRank: removeHex(data[1].textContent).trim(),
				lastLoginText: data[3].textContent.trim()
			}
			if (response.type == 'Gang') memberArray.kills = +data[2].textContent.trim();
			memberArray.lastLogin = data[3].outerHTML.match(/title="([0-9\s\-:]+)"/)[1];
			members.push(memberArray);
		}
		response.members = members;

		let vehicles = [];
		const vehiclesTable = page.querySelectorAll('#tableCars tbody tr');
		for (const elem of vehiclesTable){
			const data = elem.querySelectorAll('th');
			let vehicleArray = {
				ID: +data[0].textContent.trim(),
				image: urls.main + data[1].querySelector('img').src,
				model: +data[1].querySelector('img').src.split('/').slice(-1)[0].replace('.png', ''),
				name: data[2].textContent.trim(),
				owner: data[3].textContent.trim(),
				mileage: data[4].textContent.trim()
			}
			vehicles.push(vehicleArray);
		}
		response.vehicles = vehicles;
		return response;
	}

	function add_infoBox(iconname, title, text, color, place, extratext) {
		if (place) var infoPlace = place;
		else {
			var places = document.querySelectorAll('main div.row div.col-12');
			if (!places) return false;
			var infoPlace = places[0];
			if (!infoPlace) return false;
		}
		var infobox = document.createElement('div');
		infobox.className = 'group_infobox';
		var icon = document.createElement('i');
		icon.className = `${iconname} fa-2x group_infobox_icon`;
		if (color) icon.style.color = color;
		infobox.appendChild(icon);
		var data = document.createElement('div');
		data.style = 'display: inline-block; color: rgba(255,255,255,0.8);';
		data.innerHTML = `
			<b>${text}</b>${extratext ? '<vr></vr><span>'+extratext+'</span>' : ''}
			<br>
			<span class='group_infobox_desc'>${title}</span>
		`;
		infobox.appendChild(data);
		infoPlace.appendChild(infobox);
		return infobox;
	}

	function update_infoBox(infobox, text, extratext) {
		var textplace = infobox.querySelector('b');
		textplace.innerHTML = text;
		if (extratext) {
			var textplace2 = infobox.querySelector('span');
			textplace2.innerHTML = extratext;
		}
		return infobox;
	}

	function add_separator(text) {
		var separator = document.createElement('div');
		separator.className = 'separator';
		separator.innerHTML = text;
		return separator;
	}

	function add_tooltip(element, textInTooltip, withHTML, position, withoutTitle) {
		// <b data-toggle="tooltip" data-placement="top" title="" data-original-title="26-11-2020 12:11:00">1 godzine temu</b>
		element.setAttribute('data-toggle', 'tooltip');
		if (!withoutTitle) element.setAttribute('title', textInTooltip);
		element.setAttribute('data-original-title', textInTooltip);
		if (withHTML) element.setAttribute('data-html', 'true');
		if (position) element.setAttribute('data-placement', position);
	}

	function dli(x,a,b,c) { // original author: AFX / Wielebny
		if (x == 1) return a;
		if ((x%10 > 1) && (x%10 < 5) && (!((x%100 >= 10) && (x%100 <=21)))) return b;
		return c;
	};

	function create_groupSummary(params) {
		const defaults = {
			name: 'Grupa',
			tag: 'Grupa',
			image: 'https://i.imgur.com/siDkeax.png',
			color: '#ffffff',
			ID: 1,
			playerID: 1,
			type: 'grupa',
			leader: 'KNX',
			memberCount: 1,
			vehiclesCount: 1
		};
		const args = {...defaults, ...params};
		const player = args.members.find(member => member.ID == args.playerID);
		
		var groupSummary = document.createElement('div');
		groupSummary.className = 'groupSummary';
		groupSummary.style.borderTop = `5px solid ${args.color}`;
		groupSummary.style.boxShadow = `0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19), 0 -8px 15px -8px ${args.color}`;
		var logo = document.createElement('img');
		logo.className = 'logo';
		logo.src = args.image || defaults.image;
		groupSummary.appendChild(logo);
		var data = document.createElement('div');
		data.className = 'data';
		var name = document.createElement('h3');
		const isLeader = player.nick == args.leader;
		name.innerHTML = `${isLeader ? '<i style="color: #ffbb48; margin-right: 0.5em;" class="fas fa-crown"></i> ' : ''}<a href='${urls.group + args.ID}'>${args.name}</a> <small>${args.tag}</small>`;
		if (name.innerHTML.includes('Farmersi'))
			name.innerHTML = '<i style="color: #6b4f04; text-shadow: 0 0 3px #000;" class="fas fa-poop"></i> '+name.innerHTML;
		data.appendChild(name);
		data.appendChild(add_infoBox('fa fa-database', 'ID', args.ID, args.color, data));
		data.appendChild(add_infoBox('fa fa-cog', 'typ', args.type, args.color, data));
		if (args.level) {
			data.appendChild(add_infoBox('fa fa-star', 'poziom', args.level, args.color, data));
			checkGroupTopPosition(args.ID).then(top => data.appendChild(add_infoBox('far fa-thumbs-up', 'TOP organizacja', '#'+top, args.color, data)));
		}
		data.appendChild(add_infoBox('fa fa-user', 'lider', args.leader, args.color, data));
		data.appendChild(add_infoBox('fas fa-medal', 'ranga', player.rank.replace(/(#.{6})([^#]*)/g, '<span style="color: $1; font-weight: bold;">$2</span>'), args.color, data));
		if (args.type == 'Gang') {
			const gangKills = args.members.map(member => member.kills).reduce((a, b) => a + b);
			const percentKills = gangKills == 0 ? 100 : ((player.kills/gangKills) * 100).toFixed(1);
			data.appendChild(add_infoBox('fas fa-book-dead', `zabójstwa przez ${player.nick}`, player.kills, args.color, data, `${percentKills}% wszystkich zabójstw w organizacji`));
			data.appendChild(add_infoBox('fas fa-skull', 'łączna liczba zabójstw', gangKills, args.color, data));
			data.appendChild(add_infoBox('far fa-thumbs-up', 'respekt', args.respect, args.color, data));
		}
		data.appendChild(add_infoBox('fa fa-paint-brush', 'kolor przewodni', args.color, args.color, data));
		data.appendChild(add_infoBox('fa fa-users', 'liczba członków', (args.memberCount != args.members.length) ? `${args.memberCount} (${args.members.length})` :  args.memberCount, args.color, data));
		const playerVehicles = args.vehicles.filter(vehicle => vehicle.owner == player.nick);
		if (playerVehicles.length > 0) data.appendChild(add_infoBox('fa fa-car', 'liczba pojazdów', args.vehiclesCount, args.color, data, `${playerVehicles.length} ${dli(playerVehicles.length, 'pojazd', 'pojazdy', 'pojazdów')} gracza (${Math.ceil((playerVehicles.length / args.vehicles.length) * 100)}% wszystkich pojazdów)`));
		else data.appendChild(add_infoBox('fa fa-car', 'liczba pojazdów', args.vehiclesCount, args.color, data));
		groupSummary.appendChild(data);
		return groupSummary;
	}

	Array.prototype.random = function(){
		return this[Math.floor(Math.random()*this.length)];
	  }

	async function searchForPlayerGroup(playerID, justFractions, tab){
		let ns = org_ns;
		let s = org_s;
		ns.loadingDesc.innerText = 'Wczytywanie listy grup';
		ns.loading.bar.animate(0.01);
		const groupsList = await getGroupsList(justFractions ? 'frakcje' : 'all');
		ns.loadingDesc.innerText = 'Wczytywanie danych poszczególnych grup';
		ns.loading.bar.animate(0.2);
		let currentPosition = 0;
		let loadedGroups = [];
		if (localStorage.groups) loadedGroups = JSON.parse(localStorage.groups);
		let fractions = [];
		let organization;
		let fraction_infobox;
		for (const groupListData of groupsList) {
			if (!localStorage.groups) localStorage.groups = [];
			const ID = groupListData.ID;
			currentPosition++;
			let groupPosition = currentPosition/groupsList.length;
			ns.loadingDesc.innerText = `Wczytywanie danych grupy ${currentPosition}/${groupsList.length}\n${groupListData.name}`;
			ns.loading.bar.animate(groupPosition);
			let data;
			if (loadedGroups[ID]){
				data = loadedGroups[ID];
			} else {
				data = await getGroupDetails(ID).catch(error => console.log(error));
				loadedGroups[ID] = data;
				localStorage.groups = JSON.stringify(loadedGroups);
			}
			if (data.members.some(member => member.ID == playerID)){
				console.log(data);
				if (data.type == 'Frakcja') {
					fractions.push(data)
					const words = (data.ID == 4 || data.ID == 98) ? ['Grupa', 'w grupie'] : ['Frakcja', 'we frakcji'];
					success(words[0], `Gracz znaleziony ${words[1]} <b>${data.name}<b>`);
					if (!fraction_infobox) fraction_infobox = add_infoBox('fa fa-users', 'frakcja', `<a href='${urls.group + data.ID}'>${data.name}</a>`);
					else update_infoBox(fraction_infobox, fractions.map(fraction => `<a href='${urls.group + fraction.ID}'>${fraction.name}</a>`).join(', '));
				} else if (data.type == 'Gang' || data.type == 'Cywilna') {
					organization = data;
					success(data.type == 'Gang' ? 'Gang' : 'Organizacja cywilna', `Gracz znaleziony w ${data.type == 'Gang' ? 'gangu' : 'organizacji cywilnej'} <b>${data.name}<b>`);
					add_infoBox('fa fa-home', organization.type == 'Cywilna' ? 'organizacja cywilna' : 'gang', `<a href='${urls.group + organization.ID}'>${organization.name}</a>`);
					ns.loading.bar.animate(1);
					break;
				}
			}
			if (data.type != 'Frakcja' && justFractions) {
				ns.loading.bar.animate(1);
				break;
			}
		}
		if (fractions.length == 0) error('Frakcje', 'Gracz nie należy do żadnej frakcji / grupy do niej podobnej');
		if (!justFractions &&  !organization) error('Organizacje', 'Gracz nie należy do żadnego gangu / organizacji cywilnej.');
		for (const elem of Object.values(ns)) elem.style.opacity = '0';

		s.TITLE = document.createElement('h3');
		s.TITLE.style = 'color: white; font-weight: bold; text-shadow: -3px 4px 5px rgba(0, 0, 0, 0.93);';
//		s.TITLE.innerText = (organization && fractions.length > 0) ? 'Organizacje i frakcje' : ((organization && fractions.length == 0) ? 'Organizacje' : 'Frakcje');
		s.TITLE.innerText = (!organization && fractions.length == 0) ? 'Gracz nie należy do żadnej frakcji ani organizacji' : ((organization && fractions.length == 0) ? 'Organizacja' : ((organization && fractions.length > 0) ? 'Organizacja i frakcje' : ((!organization && fractions.length > 0) ? 'Frakcje' : 'gratuluje użytkowniku, albo się bawisz stroną, albo coś się zepsuło')));
		s.SEPARATOR = add_separator('created by eitho');
		if (organization) s.SUMMARY_ORG = create_groupSummary({vehiclesCount: organization.vehicles.length, playerID, ...organization});
		for (const fraction of fractions) {
			s[`SUMMARY_${fraction.tag}`] = create_groupSummary({vehiclesCount: fraction.vehicles.length, playerID, ...fraction});
		}
		if (!organization && fractions.length == 0) {
			const pics = ['https://img1.looper.com/img/gallery/the-worst-thing-thats-ever-happened-to-jerry-on-rick-and-morty/intro-1567519981.jpg', 'https://i.pinimg.com/originals/dd/c8/eb/ddc8eb7fff741f70b9555bcd3adb612c.jpg', 'https://memegenerator.net/img/images/15251855.jpg', 'https://thumbs.gfycat.com/FocusedVigilantBufeo-size_restricted.gif', 'https://i.pinimg.com/originals/dd/c8/eb/ddc8eb7fff741f70b9555bcd3adb612c.jpg', 'https://media1.tenor.com/images/5496e3529f82be0db6952cf8b079a470/tenor.gif'];
			s.img = document.createElement('img');
			s.img.src = pics.random();
		}

		for (const elem of Object.values(s)) {
			elem.style.opacity = '0';
			elem.style.display = 'none';
			elem.style.transition = 'all 2s';
		}
		for (const elem of Object.values(s)) tab.appendChild(elem);
		setTimeout( () => {
			for (const elem of Object.values(ns)) elem.style.display = 'none';
			for (const elem of Object.values(s)) {
				elem.style.opacity = '1';
				elem.style.removeProperty('display');
			}
		}, 3000);

	}

	let org_ns = {};
	let org_s = {};

	function prepareGroupSearch(){
		var places = document.querySelectorAll('main div.row div.col-12');
		if (!places) return;
		var buttonsPlace = places[1].querySelector('div.text-center');
		var tabsPlace = places[2];
		if (!buttonsPlace || !tabsPlace) return;

		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'btn btn-primary shadow_box tablinks';
		btn.addEventListener('click', b => {
			for (const b of buttonsPlace.querySelectorAll('.tablinks')) b.classList.remove('active');
			for (const t of tabsPlace.querySelectorAll('.tabcontent')) t.style.display = 'none';
			document.getElementById('tab_organization').style.display = 'block';
			b.target.classList.add('active');
		});
		btn.innerText = 'Organizacja';
		buttonsPlace.appendChild(btn);

		var tab = document.createElement('div');
		tab.id = 'tab_organization';
		tab.className = 'card text-center shadow_box tabcontent';
		tab.style.display = 'none';

		var t = document.createElement('div');
		t.classList = 'card-body';

		tab.appendChild(t);
		tabsPlace.appendChild(tab);

		let ns = org_ns;
		let s = org_s;

		ns.button = document.createElement('button');
		ns.button.className = 'btn btn-primary shadow_box active text-right';
		ns.button.innerText = 'Sprawdź grupy gracza';
		ns.check = document.createElement('div');
		ns.check.checkbox = document.createElement('input');
		ns.check.checkbox.type = 'checkbox';
		ns.check.checkbox.id = 'onlyFractions';
		ns.check.label = document.createElement('label');
		ns.check.label.htmlFor = 'onlyFractions';
		ns.check.label.innerText = 'Przeszukaj TYLKO frakcje / grupy (SN i RPC)';
		ns.check.label.style = 'font-size: .75em; margin-top: 1em; margin-left: 1em;'
		ns.check.appendChild(ns.check.checkbox);
		ns.check.appendChild(ns.check.label);
		ns.buttontext = document.createElement('h6');
		ns.buttontext.style = 'margin-top: 1em; display: block;';
		ns.buttontext.innerText = 'Uruchomienie tej akcji może chwilę potrwać. Czas trwania jest zależny od twojego łącza internetowego i wydajności komputera.';
		ns.loading = document.createElement('div');
		ns.loading.id = 'loading';
		ns.loading.style = 'margin: auto; width: 200px; height: 200px; position: relative; display:none;'
		ns.loadingDesc = document.createElement('h5');
		ns.loadingDesc.style = 'color: white; font-weight: bold;';
		ns.button.addEventListener('click', () => {
			ns.button.disabled = true;
			ns.check.checkbox.disabled = true;
			ns.loading.style.display = 'block';
			ns.loading.bar = new ProgressBar.Circle(ns.loading, {
				color: '#aaa',
				strokeWidth: 8,
				trailWidth: 3,
				easing: 'easeInOut',
				duration: 1000,
				text: {
				  autoStyleContainer: false
				},
				from: { color: '#ff0000', width: 3 },
				to: { color: '#349fdb', width: 5 },
				step: function(state, circle) {
					circle.path.setAttribute('stroke', state.color);
				  	circle.path.setAttribute('stroke-width', state.width);
				  	var value = Math.round(circle.value() * 100);
				  	if (value === 0) circle.setText('0%');
					else circle.setText(value + '%');
					circle.text.style.color = state.color;
				}
			});
			ns.loading.bar.text.style.fontSize = '2rem';
			const ID = window.location.pathname.split('/').slice(-1)[0];
			searchForPlayerGroup(+ID, ns.check.checkbox.checked, t);
		})
	
		for (const elem of Object.values(ns)) t.appendChild(elem);
		for (const elem of Object.values(ns)) elem.style.transition = 'all 2s ease 1s';
	}

	let PiconsAlreadyAdded = [];
	let SiconsAlreadyAdded = [];
	function addSomethingToNick(){
		function addIcon(place, where, withoutMargin, poop) {
			if (!where) where = 'after';
			let i = document.createElement('i');
			i.className = 'fas fa-code';
			i.style.color = '#ffbb48';
			i.style.textShadow = '0 0 3px #000';
			if (poop) {
				i.className = 'fas fa-poop';
				i.style.color = '#6b4f04'
			}
			place.appendChild(i);
			if (where == 'before') {
				if (!withoutMargin) i.style.marginRight = '.5em';
				i.appendBefore(place);
			} else if (where == 'child') {
				if (!withoutMargin) i.style.marginLeft = '.5em';
				place.appendChild(i);
			} else {
				if (!withoutMargin) i.style.marginLeft = '.5em';
				i.appendAfter(place);
			}
		}
		function blurNick(element, nick) {
			const str = element.innerHTML.replace(nick, `<span style='color: transparent; text-shadow: 0 0 4px rgba(255, 255, 255,0.9);'>${nick}</span>`);
			element.innerHTML = str;
		}
		const people = ['Eitho']; // jesli ktos bedzie edytowal ten skrypt to dodajcie sie tu
		const morons = ['Constanzia', '00kuba00'];
		// przerobic na jeden duzy obiekt, dodam tez pantofla tobiaszka tu potem

		function isProgrammer(player){
			if (player.innerHTML.includes('<i class="fas fa-code"')) return false;
			for (const elem of PiconsAlreadyAdded) {
				if (elem == player) return false;
			}
			for (const user of people) {
				if (player.innerHTML.includes(user)) {
					PiconsAlreadyAdded.push(player);
					return true;
				}
			}
			return false;
		}

		function isTrash(shit) {
			if (shit.innerHTML.includes('<i class="fas fa-poop')) return false;
			for (const elem of SiconsAlreadyAdded) {
				if (elem == shit) return false;
			}
			for (const user of morons) {
				if (shit.innerHTML.includes(user)) {
					SiconsAlreadyAdded.push(shit);
					blurNick(shit, user);
					return true;
				}
			}
			return false;
		}

		var profile = document.querySelector('div.group_info div.group_name');
		if (profile) {
			if (isProgrammer(profile)) addIcon(profile, 'child');
			else if (isTrash(profile)) addIcon(profile, 'child', false, true);
		}
		var friends = document.querySelectorAll('div#tab_friends tbody th a');
		if (friends.length > 0) {
			for (const friend of friends) {
				if (isProgrammer(friend)) addIcon(friend, 'after');
				else if (isTrash(friend)) addIcon(friend, 'after', false, true);
			}
		}
		var groupMembers = document.querySelectorAll('table#tableMembers tbody th a');
		if (groupMembers.length > 0) {
			for (const member of groupMembers) {
				if (isProgrammer(member)) addIcon(member, 'after');
				else if (isTrash(member)) addIcon(member, 'after', false,true);
			}
		}
		var groupVehs = document.querySelectorAll('table#tableCars tbody th');
		if (groupVehs.length > 0) {
			for (const car of groupVehs) {
				if (isProgrammer(car)) addIcon(car, 'child');
				else if (isTrash(car)) addIcon(car, 'child', false, true);
			}
		}
	}

	async function getHouses(playerID) {
		if (localStorage.houses) {
			let houses = JSON.parse(localStorage.houses);
			if (playerID && +playerID) {
				const playerHouses = houses.filter(house => house.owner == playerID);
				return playerHouses.length > 0 ? playerHouses : false;
			}
			return houses;
		}
		const page = await getPage(urls.api.houses, true);
		let houses = JSON.parse(page);
		localStorage.houses = JSON.stringify(houses);
		if (playerID && +playerID) {
			const playerHouses = houses.filter(house => house.owner == playerID);
			return playerHouses.length > 0 ? playerHouses : false;
		}
		return houses;
	}

	var timeFromNow = function (time, asString) {
		var unixTime = new Date(time).getTime();
		if (!unixTime) return;
		var now = new Date().getTime();
		var difference = (unixTime / 1000) - (now / 1000);
		var tfn = {};
		tfn.when = 'now';
		if (difference > 0) {
			tfn.when = 'future';
		} else if (difference < -1) {
			tfn.when = 'past';
		}
		difference = Math.abs(difference);
		const years = difference / (60 * 60 * 24 * 365);
		const months = difference / (60 * 60 * 24 * 45);
		const days = difference / (60 * 60 * 24);
		const hours = difference / (60 * 60);
		const minutes = difference / 60;
		if (years >= 1) {
			tfn.unitOfTime = 'years';
			tfn.time = Math.floor(years);
			tfn.dli = dli(years, 'rok', 'lata', 'lat');
		} else if (months >= 1) {
			tfn.unitOfTime = 'months';
			tfn.time = Math.floor(months);
			tfn.dli = dli(months, 'miesiąc', 'miesiące', 'miesięcy');
		} else if (days >= 1) {
			tfn.unitOfTime = 'days';
			tfn.time = Math.floor(days);
			tfn.dli = dli(days, 'dzień', 'dni', 'dni');
		} else if (hours >= 1) {
			tfn.unitOfTime = 'hours';
			tfn.time = Math.floor(hours);
			tfn.dli = dli(hours, 'godzina', 'godziny', 'godzin');
		} else if (minutes >= 1) {
			tfn.unitOfTime = 'minutes';
			tfn.time = Math.floor(minutes);
			tfn.dli = dli(minutes, 'minuta', 'minuty', 'minut');
		} else {
			tfn.unitOfTime = 'seconds';
			tfn.time = Math.floor(difference);
			tfn.dli = dli(difference, 'sekunda', 'sekundy', 'sekund');
		}
		if (asString) {
			if (tfn.when == 'now') return 'teraz'
			if (tfn.when == 'future') return `za ${tfn.time > 1 ? tfn.time : ''} ${tfn.dli}`;
			if (tfn.when == 'past') return `${tfn.time > 1 ? tfn.time : ''} ${tfn.dli} temu`;
		}
		return tfn;
	};

	async function searchForPlayerHouse(playerID) {
		if (!playerID) return;
		const houses = await getHouses(playerID);
		const allTenants = await getTenants();
		if (houses) { // jesli ma swoj dom
			for (const house of houses) {
				console.log(house);
				const position = JSON.parse(house.position)[0].map(pos => pos.toFixed(2)).join(', ');
				const infobox = add_infoBox('fas fa-house-user', 'mieszkanie', `kończy się ${timeFromNow(+house.expires * 1000, true)}`);
				let tooltip_text = `	
					<b>ID:</b> ${house.id}<br>
					<b>Cena za dobę:</b> $${house.price}<br>
					<b>Opłacone do:</b> ${new Date(house.expires*1000).toLocaleString()}<br>
					<b>Wielkość:</b> ${house.size}m<sup>2</sup><br>
					<b>Lokalizacja:</b> ${house.location}<br>
					<b>Dokładna pozycja:</b> ${position}
				`;
				add_tooltip(infobox, tooltip_text, true, false, true);
				if (allTenants) {
					const houseTenants = allTenants.filter(tenant => tenant.houseID == house.id);
					if (houseTenants.length > 0) {
						let a = [];
						let b = [];
						let tenantsInfobox;
						houseTenants.map(async tenant => {
							const player = await getPage(urls.profile + tenant.cid); // moze kiedys zrobic do tego osobna funkcje z zapisywaniem do pamieci, np getPlayerData()
							const nick = player.querySelector('div.group_name').innerText.trim();
							const rank = player.querySelectorAll('div.group_fullname')[1].innerText.trim();
							const level = player.querySelectorAll('div.group_infobox')[2].querySelector('b').innerText.trim();
							const color = colors[rank] || '#ffffff';
							a.push(`<b>[${tenant.cid}]</b> <span style='color: ${color}'>${nick}</span><small>, ${level} lvl</small>`);
							b.push(`<a href='${urls.profile + tenant.cid}' style='color: ${color}'>${nick}</a>`);
							console.log(nick, rank, level+' lvl');
							add_tooltip(infobox, tooltip_text + '<br><b>Lokatorzy: </b>'+a.join('<br>'), true, false, true);
							if (!tenantsInfobox) tenantsInfobox = add_infoBox('fas fa-couch', 'mieszkanie - lokatorzy', b.join(', '));
							else update_infoBox(tenantsInfobox, b.join(', '));
						});
					}
				}
			}
			return;
		} 
		if (!allTenants) return;
		let tenantPlayer = allTenants.filter(tenant => tenant.cid == +playerID);
		if (tenantPlayer.length > 0) { // jesli nie ma wlasnego domu ale mieszka u kogos
			tenantPlayer = tenantPlayer[0];
			const houseID = tenantPlayer.houseID;
			const houseTenants = allTenants.filter(tenant => tenant.houseID == houseID);
			const allHouses = await getHouses();
			const house = allHouses.filter(h => h.id == houseID)[0];
			console.log(house);
			getPage(urls.profile + house.owner).then(owner => {
				const nick = owner.querySelector('div.group_name').innerText.trim();
				const rank = owner.querySelectorAll('div.group_fullname')[1].innerText.trim();
				const ownerColor = colors[rank] || '#ffffff';
				const infobox = add_infoBox('fas fa-house-user', 'mieszkanie - właściciel', `<a href='${urls.profile + house.owner}' style='color: ${ownerColor}'>${nick}</a>`);
				const position = JSON.parse(house.position)[0].map(pos => pos.toFixed(2)).join(', ');
				add_tooltip(infobox, `	
					<b>ID:</b> ${house.id}<br>
					<b>Cena za dobę:</b> $${house.price}<br>
					<b>Kończy się:</b> ${timeFromNow(+house.expires * 1000, true)}<br>
					<b>Opłacone do:</b> ${new Date(house.expires*1000).toLocaleString()}<br>
					<b>Wielkość:</b> ${house.size}m<sup>2</sup><br>
					<b>Lokalizacja:</b> ${house.location}<br>
					<b>Dokładna pozycja:</b> ${position}
				`, true, false, true);
			});
			let tenants = [];
			let tenantsInfobox;
			houseTenants.map(async tenant => {
				console.log(tenant);
				if (tenant.cid == playerID) return;
				const player = await getPage(urls.profile + tenant.cid); // moze kiedys zrobic do tego osobna funkcje z zapisywaniem do pamieci, np getPlayerData()
				const nick = player.querySelector('div.group_name').innerText.trim();
				const rank = player.querySelectorAll('div.group_fullname')[1].innerText.trim();
				const color = colors[rank] || '#ffffff';
				tenants.push(`<a href='${urls.profile + tenant.cid}' style='color: ${color}'>${nick}</a>`);
				if (!tenantsInfobox) tenantsInfobox = add_infoBox('fas fa-couch', 'mieszkanie - współlokatorzy', tenants.join(', '));
				else update_infoBox(tenantsInfobox, tenants.join(', '));
			});
		}
	}

	function handleMemory(){
		function clearMemory(){
			localStorage.clear();
			localStorage.createTime = new Date().getTime();
			localStorage['data-theme'] = true;
		}
		if (!localStorage.createTime) return clearMemory();
		let now = new Date().getTime();
		if (((now - localStorage.createTime) / 60000) > 300) // 300m = 5h
			clearMemory();
	}

	function fixRectangleLogos() {
		var logos = document.querySelectorAll('div.group_logo');
		for (const logo of logos) {
			const img = logo.querySelector('img');
			const image = img.outerHTML.match(/data-src=\"([^']*?)\"/)[1];
			if (image == './public/img/ustawkurwalogoxd.png') continue;
			const ratio = img.naturalWidth / img.naturalHeight;
			if (ratio > 1.5) {
				logo.style.borderRadius = '0';
				logo.style.marginTop = '5px';
			}
		}
	}

	const colors = {
		['Global Moderator']: '#f39c12',
		Administrator: '#e05252',
		Zarząd: '#b54343',
		Moderator: '#57cca2',
		Support: '#57afcc',
		Eitho: '#ffbb48' // to tez potem mozna zmienic - jesli ktos bedzie edytowal ten skrypt, to niech sie dopisze jako nowy klucz, lub przerobi troche ten kod zeby dzialal na wiecej osob
	};

	function shadowOnAdm() {
		var place = document.querySelector('.group_info');
		var rankPlace = place.querySelectorAll('div.group_fullname')[1];
		var rank = rankPlace.innerText.trim();
		var nick = place.querySelector('div.group_name').innerText.trim();
		if (nick == 'Eitho') rank = nick;
		if (!(rank in colors)) return;
		rankPlace.style.color = colors[rank];
		place.style.borderTop = `5px solid ${colors[rank]}`;
		place.style.boxShadow = `0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19), 0 -8px 15px -8px ${colors[rank]}`;
	}


	async function checkGroupTopPosition(groupID) {
		const allgroups = await getGroupsList();
		let group = allgroups.filter(elgroup => elgroup.ID == groupID);
		if (group.length == 0) return false;
		group = group[0];
		if (group.type == 'frakcje') return false;
		if (group.type == 'cywilne') {
			const groups = await getGroupsList(group.type);
			return groups.findIndex(egroup => egroup.ID == group.ID)+1;
		}
		if (group.type == 'gangi') {
			let loadedGroups = [];
			const gangs = await getGroupsList(group.type);
			const promises = gangs.map(async group => {
				if (localStorage.groups) loadedGroups = JSON.parse(localStorage.groups);
				let data;
				if (loadedGroups[group.ID]){
					data = loadedGroups[group.ID];
				} else {
					data = await getGroupDetails(group.ID).catch(error => console.log(error));
					loadedGroups[group.ID] = data;
					localStorage.groups = JSON.stringify(loadedGroups);
				}
				return {value: data.level * data.respect, ID: group.ID};
			});
			const toSort = await Promise.all(promises);
			const sorted = [...toSort].sort((a, b) => b.value - a.value);
			return sorted.findIndex(egroup => egroup.ID == group.ID)+1;
		}
		return false;
	}

	async function insertGroupTopPosition(groupID) {
		const top = await checkGroupTopPosition(groupID);
		if (!top) return;
		const place = document.querySelector('.card-body');
		const color = place.querySelector('.group_infobox_icon').style.color;
		add_infoBox('far fa-thumbs-up', 'TOP', '#'+top, color, place);
	}

	async function getZones() {
		if (localStorage.zones) {
			const now = new Date().getTime();
			let fromCache = JSON.parse(localStorage.zones);
			if (((now - fromCache.createTime) / 60000) > 2) {
				console.log('cache too old, downloading new zones data');
				const page = await getPage(urls.api.zones, true);
				let zones = JSON.parse(page);
				localStorage.removeItem('zones');
				localStorage.zones = JSON.stringify({
					createTime: new Date().getTime(),
					data: zones
				});
				return zones;
			}
			let zones = JSON.parse(localStorage.zones).data;
			return zones;
		}
		const page = await getPage(urls.api.zones, true);
		let zones = JSON.parse(page);
		localStorage.zones = JSON.stringify({
			createTime: new Date().getTime(),
			data: zones
		});
		return zones;
	}

	async function getGangZones(gangID) {
		const zones = await getZones();
		const gangZones = zones.filter(zone => zone.owner == +gangID);
		if (gangZones.length == 0) return false;
		return gangZones;
	}

	async function addZonesToGangPage(gangID) {
		const isGang = document.querySelector('.group_infobox b').innerText == 'Gang';
		if (!isGang) return;
		const place = document.querySelector('.card-body');
		const color = place.querySelector('.group_infobox_icon').style.color;
		const gangZones = await getGangZones(+gangID);
		if (!gangZones) return add_infoBox('fas fa-flag-checkered', 'strefy', '0', color, place);;
		const allZones = await getZones();
		let percentOfAll = ((gangZones.length/allZones.length) * 100);
		percentOfAll = Number.isInteger(percentOfAll) ? percentOfAll : percentOfAll.toFixed(1);
		let percentOfGangMax = ((gangZones.length/30) * 100);
		percentOfGangMax = Number.isInteger(percentOfGangMax) ? percentOfGangMax : percentOfGangMax.toFixed(1);
		const infobox = add_infoBox('fas fa-flag-checkered', 'strefy', `${gangZones.length} / 30`, color, place, percentOfGangMax + '%');
		add_tooltip(infobox, `<b>Wszystkie tereny:</b> ${percentOfAll}%`, true);
		console.log(gangZones);
	}

	async function addZonesToMainPage() {
		const groups = document.querySelectorAll('.row')[1].querySelectorAll('.group_info');
		const zones = await getZones()
		.catch(error => false);
		if (!zones) return;
	//	let zonesButOnlyGang = [];
		for (const group of groups) {
			const groupID = group.querySelector('a.avatar').href.split('/').slice(-1)[0];
			const gangZones = zones.filter(zone => zone.owner == +groupID);
		//	zonesButOnlyGang.push({elem: group, id: +groupID, zones: gangZones});
			if (gangZones.length == 0) continue;
			const color = JSON.parse(gangZones[0]['pd_group.color'])[0]; // zakomentowac jesli byloby zmienione na top3
			group.style.borderTop = `5px solid rgb(${color[0]}, ${color[1]}, ${color[2]})`; //
			group.style.boxShadow = `0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19), 0 -8px 15px -8px rgb(${color[0]}, ${color[1]}, ${color[2]})`; //
			const place = group.querySelectorAll('a')[1];
			let div = document.createElement('div');
			div.className = 'group_name_right';
			div.innerHTML = `<i style='margin-right: .3em;' class="fas fa-flag-checkered"></i> ${gangZones.length} / 30`;
			let percentOfAll = ((gangZones.length/zones.length) * 100);
			percentOfAll = Number.isInteger(percentOfAll) ? percentOfAll : percentOfAll.toFixed(1);
			let percentOfGangMax = ((gangZones.length/30) * 100);
			percentOfGangMax = Number.isInteger(percentOfGangMax) ? percentOfGangMax : percentOfGangMax.toFixed(1);
			add_tooltip(div, `<b>Przejęte strefy</b><br>${percentOfGangMax}% maksymalnej ilości terenów na gang, ${percentOfAll}% wszystkich`, true);
			div.appendAfter(place);
		}
	/*	console.log(zonesButOnlyGang);
		const top3 = [...zonesButOnlyGang].sort((a, b) => b.zones.length - a.zones.length).slice(0, 3);
		console.log(top3);
		for (const top of top3) {
			const color = JSON.parse(top.zones[0]['pd_group.color'])[0];
			top.elem.style.borderTop = `5px solid rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			top.elem.style.boxShadow = `0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19), 0 -8px 15px -8px rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			console.log(top);
		}*/
		// jesli bym wrocil kiedys do pomyslu dawania kolorow tylko dla top 3 terenow to odkodowac
	}

	async function getTenants(playerID) {
		if (localStorage.tenants) {
			const now = new Date().getTime();
			let fromCache = JSON.parse(localStorage.tenants);
			if (((now - fromCache.createTime) / 60000) > 15) {
				const page = await getPage(urls.api.tenants, true);
				let tenants = JSON.parse(page);
				localStorage.removeItem('tenants');
				localStorage.tenants = JSON.stringify({
					createTime: new Date().getTime(),
					data: tenants
				});
				return tenants;
			}
			let tenants = JSON.parse(localStorage.tenants).data;
			return tenants;
		}
		const page = await getPage(urls.api.tenants, true);
		let tenants = JSON.parse(page);
		localStorage.tenants = JSON.stringify({
			createTime: new Date().getTime(),
			data: tenants
		});
		return tenants;
	}


	async function mainActivity(){
		console.time('ładowanie niezbędnych zasobów');
		handleMemory();
		await addIziToast();
		GM_registerMenuCommand('Usuń listę organizacji z pamięci', () => { 
			localStorage.removeItem('groupsList');
			info('Usunięto zapisane dane');
		});
		GM_registerMenuCommand('Usuń szczegółowe dane organizacji z pamięci', () => { 
			localStorage.removeItem('groups');
			info('Usunięto zapisane dane');
		});
		GM_registerMenuCommand('Usuń wszystkie dane zapisane w pamięci', () => { 
			localStorage.clear();
			info('Usunięto zapisane dane');
		});
		GM_registerMenuCommand('ustawienia', () => { 
			info('w planach');
			// TODO po kliknieciu tego bedzie sie odpalac okienko z ustawieniami
		});
		const userdata = await getUser();
		const url = window.location.href;
		if (!userdata) info('Nie zalogowano', 'nie nastąpiło logowanie, niektóre funkcje mogą nie działać.', 3000); // to tez mozna wywalic w sumie bo bylo dodane tylko przy okazji robienia wyswietlania sygnatury
		else if (url == urls.main+'/') info('Dane załadowane', `Cześć, <b>${userdata.name}</b>`, 15000);

		if (url.startsWith(urls.group)) {
			document.body.addEventListener('click', evt => { // to klikanie niestety tak musi byc, ze wzgledu na paginacje niektorych rzeczy
				addColorToRanks();
				prepareLastDrivers('group');
				addSomethingToNick();
			});
			addColorToRanks();
			prepareLastDrivers('group');
			addSomethingToNick();
			const ID = window.location.pathname.split('/').slice(-1)[0];
			insertGroupTopPosition(ID);
			addZonesToGangPage(ID);
		} else if (url.startsWith(urls.profile)){
			const ID = window.location.pathname.split('/').slice(-1)[0];
			document.body.addEventListener('click', evt => {
				prepareLastDrivers('profile');
				prepareSignature();
			});
			shadowOnAdm();
			prepareLastDrivers('profile');
			prepareGroupSearch();
			addSomethingToNick();
			searchForPlayerHouse(ID);
		} else if (url == urls.main + '/') {
			addZonesToMainPage();
			window.addEventListener('load', fixRectangleLogos);
		}

		console.timeEnd('ładowanie niezbędnych zasobów');
		GM_addStyle(`
		.separator {
			display: flex;
			align-items: center;
			text-align: center;
			color: #8a8a8a;
			font-size: .75em;
			margin: 2em 0;
		}
		.separator::before, .separator::after {
			content: '';
			flex: 1;
			border-bottom: 1px solid #424242;
		}
		.separator::before {
			margin-right: .5em;
		}
		.separator::after {
			margin-left: .5em;
		}

		body {
			font-family: 'Fira Sans', sans-serif;
		}
		
		.groupSummary {
			font-family: 'Fira Sans', sans-serif;
		/*	text-align: left; */
			background: var(--col-1);
			padding: .6em .5em;
			margin: 1em 0.3em 0;
			box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
			border-radius: 10px;
		}
		  
		.groupSummary .logo {
			width: 35%;
			display: inline-block;
			padding: 0.25em 1em;
			float: left;
			filter: drop-shadow(-7px 9px 3px rgba(0,0,0,0.49));
			transition: filter 1s, transform 1s, border-radius 3s;
		}

		.groupSummary .logo:hover {
			transform: scale(2);
			border-radius: 35px;
			filter: drop-shadow(-7px 9px 3px rgba(0,0,0,0.89));
		}
		  
		.groupSummary .data {
			display: inline-block;
			padding: 1em 0;
		/*	position: absolute; */
		}
		
		.groupSummary small {
			font-size: 0.4em;
		}

		.group_infobox {
			font-weight: initial;
		}

		.data .group_infobox {
			padding: 8px 13px;
			margin: 9px 5px 0;
			display: block;
			min-width: 60vh;
		}

		.data .group_infobox_desc {
			font-weight: 400;
		}
		div#tab_friends .skin {
			transition: filter 1s, transform 1s;
		}

		div#tab_friends .skin:hover {
			transform: scale(2);
			filter: drop-shadow(-3px 4px 2px rgba(0,0,0,0.59));
		}

		.vehicle_img {
			transition: filter 1s, transform 1s;
		}

		.vehicle_img:hover {
			transform: scale(5.5);
			filter: drop-shadow(-3px 4px 2px rgba(0,0,0,0.59));
		}

		vr {
			display: inline;
			margin-left: 1em;
			margin-right: 1em;
		}
		
		vr::before{
			content: '|';
		}

		.tooltip {
			font-family: font-family: 'Fira Sans', sans-serif;
		}

		.tooltip-inner{
			max-width: 300px;
		}

		.group_name_right {
			display: inline-block;
			float: right;
			margin-top: .8em;
			font-size: .9em;
		/*	font-weight: 600; */
		}
		`);
		const font = await getPage('https://fonts.googleapis.com/css2?family=Fira+Sans&display=swap', true);
		GM_addStyle(font);
	}
	mainActivity();
	// TODO pobawic sie @connect w tagach (Proszę zauważyć, że autorzy skryptu mogą uniknąć wyświetlania tego okna dialogowego dodając @connect tags ⬀ do ich skryptów.)
	// TODO zabrac sie za mape - dodanie pokazywania lokatorow w mieszkaniach tam, nie wiem co jeszcze zmienic
	// TODO ogarniecie kodu z wyszukiwaniem organizacji gracza - to byla jedna z pierwszych funkcjonalnosci tutaj i nie wiedzialem jeszcze jak to dobrze pisac, no i wyszlo gowno
	// TODO ogarnac funkcje addSomethingToNick bo to syf kila i mogila
	// TODO ogarnac funkcje shadowOnAdm, bo nie jest przystosowana pod rozbudowe i tez troche chuj dupa i kamieni kupa
	// TODO dodac okienko z ustawieniami
	// TODO wyswietlanie kto ze znajomych jest online - tutaj cache 5 minut
	// TODO ŁADOWANIE BIBLIOTEK TYLKO NA STRONACH KTORE TEGO POTRZEBUJA - SZYBSZE WCZYTYWANIE SKRYPTU - !WAŻNE
	// TODO przycisk do przerywania wyszukiwania organizacji gracza: jest zmienna jakas, w petli sprawdzanie czy jest false, jesli true to break - po kliknieciu na przycisk PRZERWIJ zmieniana na true
	// TODO zapobieganie tak częstemu wylogowywaniu - trzeba czekac az GM_cookie wyjdzie z bety w tampermonkey
})();