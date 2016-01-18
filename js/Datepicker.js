/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts"/>
///<reference path="../typescript/Constants.ts"/>
/**
* class DateTimePickerWidget
*/
var DateTimePickerWidget = (function () {
    /**
    * @constructor
    */
    function DateTimePickerWidget(data) {
        var _this = this;
        /**
        * Adds Styles for dates on the calendar
        * Previous and next month dates should be slightly grayed out and today's date should be highlighted.
        */
        this.DateCss = function (selectedDate) {
            var startOfMonth = _this.CurrentDate().clone().startOf('month');
            var endOfMonth = _this.CurrentDate().clone().endOf('month');
            if (selectedDate.format('L') == moment().format('L'))
                return 'today';
            if (selectedDate.format('L') == _this.CurrentDate().format('L'))
                return 'selected-date';
            if (selectedDate.isAfter(moment()))
                return 'disabled-date';
            if (selectedDate.isBefore(startOfMonth) || selectedDate.isAfter(endOfMonth))
                return 'other-month';
            return "";
        };
        /** Called when a Date is selected. */
        this.DateClicked = function (givenDate) {
            // If the user selects a date in the previous/next month we will need to redraw the dates grid so that the change of month is visible.
            var bNeedsToRedrawDates = givenDate.month() != _this.CurrentDate().month();
            _this.CurrentDate(givenDate);
            if (bNeedsToRedrawDates)
                _this.repopulateCalendarDays();
        };
        /** Click handler for when a month is clicked. */
        this.MonthClicked = function (monthName) {
            // Update the current date with the selected month
            var selectedMonthDate = moment().month(monthName);
            _this.CurrentDate(_this.CurrentDate().set("month", selectedMonthDate.month()));
            _this.setSelectionState(DateTimePickerSelector.USER_SELECTING_DAY);
            _this.repopulateCalendarDays();
        };
        this.ParentDate = ko.observable(data.date);
        var tempParentDate = this.ParentDate();
        this.CurrentDate = ko.observable(tempParentDate);
        // By default nothing is visible.
        this.IsVisible = ko.observable(false);
        this.selectionState = ko.observable(DateTimePickerSelector.USER_SELECTING_DAY);
        this.Dates = ko.observableArray(new Array());
        // Cache strings for month names since it's used often.
        this.MonthsShort = moment.monthsShort();
        this.CanPickTime = ko.observable(data.pickTime);
        this.CanPickDate = ko.observable(data.pickDate);
        // CalculateTitle is a computed function ...Gets calculated each time currentDate changes
        this.DisplayTitle = ko.computed(this.calculateTitle, this);
        // Calculates + formats the currently selected date value to show to the user.
        this.DisplayValue = ko.computed(this.calculateDisplayValue, this);
        this.subscribeParentDate();
    }
    /** Decrements hours */
    DateTimePickerWidget.prototype.DecrementHours = function () {
        var currentDate = this.CurrentDate();
        var hoursDecremented = this.constrainToRange(0, 23, currentDate.hours() - 1);
        currentDate.hours(hoursDecremented);
        this.CurrentDate(currentDate);
    };
    /** Decrements minutes */
    DateTimePickerWidget.prototype.DecrementMinutes = function () {
        var currentDate = this.CurrentDate();
        var minutesDecremented = this.constrainToRange(0, 59, currentDate.minutes() - 1);
        currentDate.minutes(minutesDecremented);
        this.CurrentDate(currentDate);
    };
    /** Decrements the current month */
    DateTimePickerWidget.prototype.DecrementMonth = function () {
        this.CurrentDate(this.CurrentDate().add(-1, 'M').startOf('month'));
        this.repopulateCalendarDays();
    };
    /** Decrements the current year */
    DateTimePickerWidget.prototype.DecrementYear = function () {
        this.CurrentDate(this.CurrentDate().add(-1, 'year'));
    };
    /** Used to get hours */
    DateTimePickerWidget.prototype.GetHours = function () {
        var currentDate = this.CurrentDate();
        var hours = currentDate.hours();
        return (hours < 10) ? '0' + hours : hours.toString();
    };
    /** Gets minutes */
    DateTimePickerWidget.prototype.GetMinutes = function () {
        var currentDate = this.CurrentDate();
        var minutes = currentDate.minutes();
        return (minutes < 10) ? '0' + minutes : minutes.toString();
    };
    /** Increments the current dates Hours by 1. */
    DateTimePickerWidget.prototype.IncrementHours = function () {
        var currentDate = this.CurrentDate();
        var hoursIncremented = this.constrainToRange(0, 23, currentDate.hours() + 1);
        currentDate.hours(hoursIncremented);
        this.CurrentDate(currentDate);
    };
    /** Increments minutes */
    DateTimePickerWidget.prototype.IncrementMinutes = function () {
        var currentDate = this.CurrentDate();
        var minutesIncremented = this.constrainToRange(0, 59, currentDate.minutes() + 1);
        currentDate.minutes(minutesIncremented);
        this.CurrentDate(currentDate);
    };
    /** Increments the current month */
    DateTimePickerWidget.prototype.IncrementMonth = function () {
        this.CurrentDate(this.CurrentDate().add(1, 'M').startOf('month'));
        this.repopulateCalendarDays();
    };
    /** Increments the current year */
    DateTimePickerWidget.prototype.IncrementYear = function () {
        this.CurrentDate(this.CurrentDate().add(1, 'year'));
    };
    /** Is the user currently selecting a day? */
    DateTimePickerWidget.prototype.IsSelectingDay = function () {
        return this.selectionState() == DateTimePickerSelector.USER_SELECTING_DAY;
    };
    /** Is the user currently selecting a time? */
    DateTimePickerWidget.prototype.IsSelectingTime = function () {
        return this.selectionState() == DateTimePickerSelector.USER_SELECTING_TIME;
    };
    /** Is the user currently selecting a month? */
    DateTimePickerWidget.prototype.IsSelectingMonth = function () {
        return this.selectionState() == DateTimePickerSelector.USER_SELECTING_MONTH;
    };
    /** Adds styles for current month in months panel on calendar */
    DateTimePickerWidget.prototype.MonthCss = function (monthName) {
        var currentMonthName = this.MonthsShort[moment().month()];
        if (monthName == currentMonthName)
            return 'current-month';
        return '';
    };
    /** Shows the Month picker UI. */
    DateTimePickerWidget.prototype.ShowMonthPicker = function () {
        this.setSelectionState(DateTimePickerSelector.USER_SELECTING_MONTH);
    };
    /** Kills event propagation */
    DateTimePickerWidget.prototype.StopClickEventPropogation = function (data, e) {
        e.stopImmediatePropagation();
    };
    DateTimePickerWidget.prototype.ToggleClockPicker = function (viewModel) {
        var pickerDisplayValue = viewModel.CanPickTime();
        viewModel.CanPickTime(!pickerDisplayValue);
    };
    /** Switches between the time & day picker. */
    DateTimePickerWidget.prototype.ToggleTimePicker = function (viewModel, jqueryEvent) {
        if (!this.IsSelectingTime())
            this.setSelectionState(DateTimePickerSelector.USER_SELECTING_TIME);
        else {
            this.setSelectionState(DateTimePickerSelector.USER_SELECTING_DAY);
            this.repopulateCalendarDays();
        }
        jqueryEvent.stopImmediatePropagation();
    };
    /**
    * On Click of Calendar Icon.
    * Shows the calendar if display property is off, else it is hidden.
    * Triggering the document click, so that if any calendar is visible hiding the same.
    * Stopping further Propagation as it would continue further and hide other events.
    */
    DateTimePickerWidget.prototype.ToggleVisible = function (data, e) {
        var isPickerVisible = this.IsVisible();
        $(document).trigger('click');
        // If a date hasn't been set yet (or it's invalid) set one when the DateTimePicker opens.
        if (!this.CurrentDate().isValid())
            this.CurrentDate(moment());
        this.repopulateCalendarDays();
        // If the calendar is hidden, show it and display the date picker screen.
        this.IsVisible(!isPickerVisible);
        this.setSelectionState(DateTimePickerSelector.USER_SELECTING_DAY);
        // When we open the DateTimePicker the popup is rendered outside the normal document flow and can thus extend
        // our page beyond the 'body's dimensions. Some elements within Foundation rely on the page being 100% height and 
        // therefore we need to fix the bodies height while the picker is open.
        DateTimePickerWidget.FixPageHeightOnOpen();
        e.stopPropagation();
    };
    /** Compute function used to calculate display value for the main input box. */
    DateTimePickerWidget.prototype.calculateDisplayValue = function () {
        // Treat invalid dates as 'no selections'.
        if (!this.CurrentDate().isValid())
            return '';
        else if (this.CurrentDate().isAfter(moment()))
            return this.CanPickTime() ? moment().format('L') : moment().format('L');
        return this.CanPickTime() ? this.CurrentDate().format('L') : this.CurrentDate().format('L');
    };
    /** Computed function which calculates the display title of the date time picker. */
    DateTimePickerWidget.prototype.calculateTitle = function () {
        if (this.IsSelectingDay())
            return moment.months()[this.CurrentDate().month()] + ' ' + this.CurrentDate().year().toString();
        else if (this.IsSelectingMonth())
            return this.CurrentDate().year().toString();
        return '';
    };
    /**
    * Constrains a value (inclusively) between min and max. If the value is < min it'll roll over to max.
    * Similarly if value is > max it'll roll over to min.
    */
    DateTimePickerWidget.prototype.constrainToRange = function (min, max, value) {
        if (value > max)
            return min + (value - max) - 1;
        else if (value < min)
            return max - (min - value) + 1;
        return value;
    };
    /**
    * Repopulates the 2d grid of selectable dates in a month. Will properly pad out days
    * in previous & next month such that it fits nicely in a 7x6 grid.
    */
    DateTimePickerWidget.prototype.repopulateCalendarDays = function () {
        var momentArray = [[], [], [], [], [], []];
        var firstDayInMonth = this.CurrentDate().clone().startOf('month');
        var iStartingWeekDayNumber = firstDayInMonth.weekday();
        if (iStartingWeekDayNumber == 0)
            iStartingWeekDayNumber = 7;
        var startingDayInPreviousMonth = firstDayInMonth.add(-iStartingWeekDayNumber, 'd');
        var tempDay = startingDayInPreviousMonth;
        // Copy over the hours, minutes & seconds of the current date so that when the user selects the new date the time component is preserved.
        tempDay.hours(this.CurrentDate().hours());
        tempDay.minutes(this.CurrentDate().minutes());
        tempDay.seconds(this.CurrentDate().seconds());
        for (var indexRow = 0; indexRow < 6; indexRow++) {
            for (var indexColumn = 0; indexColumn < 7; indexColumn++) {
                var tempDayCloned = tempDay.clone();
                momentArray[indexRow].push(tempDayCloned);
                tempDay.add(1, "d");
            }
        }
        this.Dates(momentArray);
    };
    /** Sets the current user selection state */
    DateTimePickerWidget.prototype.setSelectionState = function (selectionSate) {
        this.selectionState(selectionSate);
    };
    /** Method to subscribe parent date */
    DateTimePickerWidget.prototype.subscribeParentDate = function () {
        var self = this;
        this.ParentDate.subscribe(function (newValue) {
            self.CurrentDate(newValue);
        }, self);
    };
    /**
    * Restores the pages height property on DateTimePicker close
    * Value: 100% taken from Foundation Library.
    */
    DateTimePickerWidget.RestorePageHeightOnClose = function () {
        $("body").css("height", "100%");
    };
    /**
    * Fix the body height to be the document's height so that the bodies dimensions take into account absolutely positioned
    * DateTimePicker popup.
    */
    DateTimePickerWidget.FixPageHeightOnOpen = function () {
        $("body").css("height", $(document).height());
    };
    return DateTimePickerWidget;
})();
/* Component for Date
ko.components.register("widget-datetimepicker", {
    template: { element: 'DateTimePicker.tmpl.html' },
    viewModel: function (params: any) {
        var dateTimePickerWidget: DateTimePickerWidget = new DateTimePickerWidget(params);
        return dateTimePickerWidget;
    }
});
*/
// Whenever the document receives a click event
// Checks for any visible calendars, If any exists hides the first calendar.
$(document).click(function () {
    var visibleCalendars = jQuery(".datetimepicker:visible");
    var visibleCalendarsLength = visibleCalendars.length;
    if (visibleCalendarsLength > 0) {
        var contextData = ko.contextFor(visibleCalendars[0]);
        var classForContext = contextData.$data;
        if (classForContext.CurrentDate().isAfter(moment()))
            classForContext.CurrentDate(moment());
        classForContext.ParentDate(classForContext.CurrentDate());
        classForContext.IsVisible(false);
        // When the DateTimePicker is hidden restore the height properties of the page to revert 
        // changes required for abs positioning.
        DateTimePickerWidget.RestorePageHeightOnClose();
    }
});
