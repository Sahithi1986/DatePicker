/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts"/>
var Parameters = (function () {
    function Parameters(pickDate, pickTime, date) {
        this.pickDate = pickDate;
        this.pickTime = pickTime;
        this.date = date;
    }
    return Parameters;
})();
