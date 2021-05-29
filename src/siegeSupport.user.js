//////////////////////
// ==UserScript==
// @name		NPC砦攻略支援ツール
// @namespace
// @description	ブラウザ三国志 NPC攻略用の予約をスプレッドシートと同期
// @include		*://w20.3gokushi.jp/land.php*
// @connect		3gokushi.jp
// @author      みどり
// @version 	0.3
// @updateURL	https://github.com/MIDORI-bro3/-bro3_siegehelper/blob/master/src/siegeSupport.user.js
// @grant	none
// @require	https://code.jquery.com/jquery-2.1.4.min.js
// @require	https://code.jquery.com/ui/1.11.4/jquery-ui.min.js
// @resource	jqueryui_css	http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/smoothness/jquery-ui.css
// ==/UserScript==
// 2021.05.23	0.2	配布初期バージョン
// 2021.05.29	0.3	公開用情報の追加　w20での動作のみに変更 隣接報告機能を追加
var VERSION = "0.3";

var HOST = location.hostname;

//----------------------------------------------------------------------
// グローバル変数群
//----------------------------------------------------------------------
// オプション設定管理用
var g_helper_options;
// ユーザー名
var userName = "みどり";
//GasアプリURL(バージョン 24
var gasUrl = 'https://script.google.com/macros/s/AKfycbwMSBhwwpvdXdvxfsxxF4PHWRttoP5pnpZEwVTHZQhtS2lr6pxmuc7CFJEQOYTzl1S61w/exec';
//その他スプシ関連項目
var attackerKey = '攻略者'

//----------------------------------------------------------------------
// 画面設定項目-保存フィールド名対応定数群
//----------------------------------------------------------------------
// 共通タブ
var SIEGEHELPER_01 = 'sh01';		// ユーザー名
var SIEGEHELPER_02 = 'sh02';		// GoogleスプレッドシートURL
var SIEGEHELPER_03 = 'sh03';		// スプレッドシートコントローラ(GAS)URL

//----------------------------------------------------------------------
// スクリプト全体で共有する固有定義
//----------------------------------------------------------------------
var SERVER_SCHEME = location.protocol + "//";
var BASE_URL = SERVER_SCHEME + location.hostname;
var SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];
var SORT_UP_ICON = BASE_URL + "/20160427-03/extend_project/w945/img/trade/icon_up.gif";
var SORT_DOWN_ICON = BASE_URL + "/20160427-03/extend_project/w945/img/trade/icon_down.gif";

//----------------------------------------------------------------------
// メイン処理
//----------------------------------------------------------------------
(function() {
    jQuery.noConflict();
    var $ = jQuery;

    'use strict';
    // Your code here...
//////
    // 広告iframe内で呼び出された場合は無視
	if (!$("#container").length) { return; }
	// 歴史書モードの場合は無視
	if ($("#sidebar img[title=歴史書]").length){ return; }
//////
	// プロフィール画面
	if (location.pathname === "/user/" || location.pathname === "/user/index.php") {
        // 他人のプロフィールならtrue
        if ($(location).attr('search').length > 0) {
            return;
        }
        // プロフィール画面のユーザ名取得
        //userName = $("#gray02Wrapper table[class='commonTables'] tbody tr").eq(1).children("td").eq(1).text().replace(/[ \t\r\n]/g, "");
        return;
	}

    //NPC砦かチェックする
    //タイル一覧のテキストを取得して
    var checkNpc = $.trim($("#production2 li:first").text());
    //平地タイル=49ならNPC砦orNPC城...
    if( checkNpc != "平地タイル  49"){return;}
    // 拠点名を取得
    var baseName = $.trim($("#basepoint span:first").text());

    //alert(baseName);
    //状態画面の後ろに追加
    //ボタン4(隣接報告)
    $("#tMenu_btnif").after("<button id='siegehelper_button_adjecent' disabled=false >隣接報告</button>");
    //ボタン3(予約確認))
    $("#tMenu_btnif").after("<button id='siegehelper_button_update' disabled=false >予約確認</button>");
    //ボタン2(解除)
    $("#tMenu_btnif").after("<button id='siegehelper_button_reservation_cancel' disabled=false>予約解除（未実装です・・・)</button>");
    //ボタン1(予約)
    $("#tMenu_btnif").after("<button id='siegehelper_button_reservation' disabled=false>攻略予約</button>");
    //情報表示用テキストボックス
    $("#tMenu_btnif").after("<div><p>Siege Helper</p></div><div style='margin-left: 4px;'><textarea id='SiegeHleper_outtext' cols='40' rows='1' style='overflow: margin: 4px; '></textarea></div>");

    //var userName = GM_getValue(SERVER_NAME + '_username', null);
    if( "" === userName ){
        $("#SiegeHleper_outtext").val( "あなたの名前を教えてください:Please tel me your name");
        return;
    }
    else{
        //alert("Your name are"+userName+"?");
    }
    //ボタンクリックで動作するイベントを設定
    $('#siegehelper_button_update').on('click',function(){reservation_check();});
    $('#siegehelper_button_reservation').on('click',function(){reservation_make();});
    $('#siegehelper_button_adjecent').on('click',function(){report_adjecent();});

    //オープン時に一発予約確認
    reservation_check();

　　// 隣接報告処理
    function report_adjecent(){
        // 送信情報配列
        var reqpalam = {
            'func':'ReportAdjacent',
            'fortName':baseName
        };
        //$("#SiegeHleper_outtext").val( "隣接報告中:Please wait");
        //多重クリック禁止用
        button_controler("adjecentOFF");//報告ボタンのみOFF
        $.ajax({
            type: "get",
            url: gasUrl,
            data: reqpalam,
            dataType:'jsonp',
            callback: 'callback'//コールバックパラメータ名の指定
        }).done(function(data) {
            //成功時の処理
            alert("SSに報告をアップロードしました");
            button_controler("adjecentON");//報告ボタンのみON
        }).fail(function(jqXHR, textStatus, errorThrown){
            $("#SiegeHleper_outtext").val("なんかエラー：エラー処理(予約確認)\n"
                                          +"XMLHttpRequest : " + jqXHR.status
                                          + "\ntextStatus     : " + textStatus
                                          + "\nerrorThrown: " + errorThrown.message);
        });
    }
　　// 予約チェック処理
    function reservation_check(){
        // 送信情報配列
        var reqpalam = {
            'func':'CheckReservation',
            'fortName':baseName
        };
        $("#SiegeHleper_outtext").val( "予約確認中:Please wait");
        //多重クリック禁止用
        button_controler(0);//全部トーンダウン
        $.ajax({
            type: "get",
            url: gasUrl,
            data: reqpalam,
            dataType:'jsonp',
            callback: 'callback'//コールバックパラメータ名の指定
        }).done(function(data) {
            //成功時の処理
            $("#SiegeHleper_outtext").val("予約情報取得成功⇒解析中:please wait");
            if( data.length === 0){
                $("#SiegeHleper_outtext").val("だれも予約してないよ～");
                button_controler(1);//予約なし
            }
            else{
                $("#SiegeHleper_outtext").val(data.length+"人が予約中");
                for( var loop = 0; loop < data.length; loop++){
                    if(data[loop][attackerKey]){
                        //自分の予約かチェック
                        if(userName == data[loop][attackerKey]){
                            $("#SiegeHleper_outtext").val(String($("#SiegeHleper_outtext").val())+"["+data[loop][attackerKey]+"(★あなた★)]");
                            button_controler(2);//自分が予約
                        }
                        else{
                            $("#SiegeHleper_outtext").val(String($("#SiegeHleper_outtext").val())+"["+data[loop][attackerKey]+"]");
                            button_controler(3);//他人が予約
                        }
                    }
                }
            }
        }).fail(function(jqXHR, textStatus, errorThrown){
            $("#SiegeHleper_outtext").val("なんかエラー：エラー処理(予約確認)\n"
                                          +"XMLHttpRequest : " + jqXHR.status
                                          + "\ntextStatus     : " + textStatus
                                          + "\nerrorThrown: " + errorThrown.message);
        });
    }
　　// 予約処理
    function reservation_make(){
        // 送信情報配列
        var reqpalam = {
            'func':'MakeReservation',
            'fortName':baseName,
            'playerName':userName,
            'note':""
        };
        //多重クリック禁止用
        button_controler(0);//全部トーンダウン
        $("#SiegeHleper_outtext").val( "予約処理中:Please wait");
        $.ajax({
            type: "GET",
            url: gasUrl,
            data: reqpalam,
            dataType:'jsonp',//jsonpの場合POSTが使えないらしい。。。
            callback: 'callback'//コールバックパラメータ名の指定
        }).done(function(data) {
            //成功時の処理
            //予約結果確認
           reservation_check();
        }).fail(function(jqXHR, textStatus, errorThrown){
            $("#SiegeHleper_outtext").val("なんかエラー：エラー処理(予約確認)\n"
                                          +"XMLHttpRequest : " + jqXHR.status
                                          + "\ntextStatus     : " + textStatus
                                          + "\nerrorThrown: " + errorThrown.message);
        });
    }

    //予約ボタンのトーンアップ/ダウン制御
    function button_controler(typeValue)
    {
        // 初期値を取得
        var reservation_button = document.getElementById('siegehelper_button_reservation').disabled;//予約ボタン
        var cancel_button = document.getElementById('siegehelper_button_reservation_cancel').disabled;//予約解除ボタン
        var update_button = document.getElementById('siegehelper_button_update').disabled;//更新ボタン
        var adjecent_button = document.getElementById('siegehelper_button_adjecent').disabled;//隣接ボタン
        switch(typeValue){
            case 1://予約なし
                reservation_button = false;
                cancel_button = true;
                update_button = false;
                adjecent_button = false;
                break;
            case 2://自分が予約
                reservation_button = true;
                cancel_button = false;
                update_button = false;
                adjecent_button = false;
                break;
            case 3://他人が予約
                reservation_button = true;
                cancel_button = true;
                update_button = false;
                adjecent_button = false;
                break;
            case "adjecentON"://隣接報告のみトーンアップ
                adjecent_button = false;
                break;
            case "adjecentOFF"://隣接報告のみトーンダウン
                adjecent_button = true;
                break;
            default://全非表示
                reservation_button = true;
                cancel_button = true;
                update_button = true;
                adjecent_button = true;
                break;
        }
        document.getElementById('siegehelper_button_reservation').disabled=reservation_button;
        document.getElementById('siegehelper_button_reservation_cancel').disabled=cancel_button;
        document.getElementById('siegehelper_button_update').disabled=update_button;
        document.getElementById('siegehelper_button_adjecent').disabled=adjecent_button;
    }

})();