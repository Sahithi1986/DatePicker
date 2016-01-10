/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts"/>

class DateTimePickerSelector {
    /**
     *  Enum of Time Selection
     *  @returns {number} number for Time Selection
     */
    public static get USER_SELECTING_TIME(): number {
        return 0;
    }

    /**
     *  Enum of Day Selection
     *  @returns {number} number for Day Selection
     */
    public static get USER_SELECTING_DAY(): number {
        return 1;
    }

    /**
     *  Enum of Day Selection
     *  @returns {number} number for Day Selection
     */
    public static get USER_SELECTING_MONTH(): number {
        return 2;

    }
}


/**
* class DateTimePickerWidget
*/
class DateTimePickerWidget {
    /** Is the user able to select a Time? */
    public CanPickTime: KnockoutObservable<boolean>;

    /** Is the user able to select a Date? */
    public CanPickDate: KnockoutObservable<boolean>;

    /** Currently selected date */
    public CurrentDate: KnockoutObservable<moment.Moment>;

    /** Parent date */
    public ParentDate: KnockoutObservable<moment.Moment>;

    /** Holds 2D array of dates for displaying days in a month. */
    public Dates: KnockoutObservableArray<moment.Moment[]>;

    public DisplayTitle: KnockoutComputed<string>;

    public DisplayValue: KnockoutComputed<string>;

    /** Is the date time picker visible? */
    public IsVisible: KnockoutObservable<boolean>;

    /** Short Names of Months */
    public MonthsShort: string[];

    /** Current user selection state. Either picking Time/Day or Month. */
    private selectionState: KnockoutObservable<number>;

    /**
    * @constructor
    */
    constructor(data: any) {
        this.ParentDate = ko.observable(data.date);
        var tempParentDate: moment.Moment = this.ParentDate();
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

    /**
    * Adds Styles for dates on the calendar
    * Previous and next month dates should be slightly grayed out and today's date should be highlighted.
    */
    public DateCss = (selectedDate: moment.Moment) => {
        var startOfMonth:moment. Moment = this.CurrentDate().clone().startOf('month');
        var endOfMonth: moment.Moment = this.CurrentDate().clone().endOf('month');
        if (selectedDate.format('L') == moment().format('L'))
            return 'today';
        if (selectedDate.format('L') == this.CurrentDate().format('L'))
            return 'selected-date';
        if(selectedDate.isAfter(moment()))
            return 'disabled-date';
        if (selectedDate.isBefore(startOfMonth) || selectedDate.isAfter(endOfMonth))
            return 'other-month';
            return "";
    }

    /** Called when a Date is selected. */
    public DateClicked = (givenDate: moment.Moment) => {
        // If the user selects a date in the previous/next month we will need to redraw the dates grid so that the change of month is visible.
        var bNeedsToRedrawDates: boolean = givenDate.month() != this.CurrentDate().month();
        this.CurrentDate(givenDate);
        if (bNeedsToRedrawDates)
            this.repopulateCalendarDays();
    }

    /** Decrements hours */
    public DecrementHours(): void {
        var currentDate: moment.Moment = this.CurrentDate();
        var hoursDecremented: number = this.constrainToRange(0, 23, currentDate.hours() - 1);
        currentDate.hours(hoursDecremented);
        this.CurrentDate(currentDate);
    }

    /** Decrements minutes */
    public DecrementMinutes(): void {
        var currentDate:moment.Moment = this.CurrentDate();
        var minutesDecremented: number = this.constrainToRange(0, 59, currentDate.minutes() - 1);
        currentDate.minutes(minutesDecremented);
        this.CurrentDate(currentDate);
    }

    /** Decrements the current month */
    public DecrementMonth(): void {
        this.CurrentDate(this.CurrentDate().add(-1, 'M').startOf('month'));
        this.repopulateCalendarDays();
    }

    /** Decrements the current year */
    public DecrementYear(): void {
        this.CurrentDate(this.CurrentDate().add(-1, 'year'));
    }

    /** Used to get hours */
    public GetHours(): string {
        var currentDate: moment.Moment = this.CurrentDate();
        var hours: number = currentDate.hours();
        return (hours < 10) ? '0' + hours : hours.toString();
    }

    /** Gets minutes */
    public GetMinutes(): string {
        var currentDate: moment.Moment = this.CurrentDate();
        var minutes: number = currentDate.minutes();
        return (minutes < 10) ? '0' + minutes : minutes.toString();
    }

    /** Increments the current dates Hours by 1. */
    public IncrementHours(): void {
        var currentDate: moment.Moment = this.CurrentDate();
        var hoursIncremented: number = this.constrainToRange(0, 23, currentDate.hours() + 1);
        currentDate.hours(hoursIncremented);
        this.CurrentDate(currentDate);
    }

    /** Increments minutes */
    public IncrementMinutes(): void {
        var currentDate: moment.Moment = this.CurrentDate();
        var minutesIncremented: number = this.constrainToRange(0, 59, currentDate.minutes() + 1);
        currentDate.minutes(minutesIncremented);
        this.CurrentDate(currentDate);
    }

    /** Increments the current month */
    public IncrementMonth(): void {
        this.CurrentDate(this.CurrentDate().add(1, 'M').startOf('month'));
        this.repopulateCalendarDays();
    }

    /** Increments the current year */
    public IncrementYear(): void {
        this.CurrentDate(this.CurrentDate().add(1, 'year'));
    }

    /** Is the user currently selecting a day? */
    public IsSelectingDay(): boolean {
        return this.selectionState() == DateTimePickerSelector.USER_SELECTING_DAY;
    }

    /** Is the user currently selecting a time? */
    public IsSelectingTime(): boolean {
        return this.selectionState() == DateTimePickerSelector.USER_SELECTING_TIME;
    }

    /** Is the user currently selecting a month? */
    public IsSelectingMonth(): boolean {
        return this.selectionState() == DateTimePickerSelector.USER_SELECTING_MONTH;
    }

    /** Click handler for when a month is clicked. */
    public MonthClicked = (monthName: string) => {
        // Update the current date with the selected month
        var selectedMonthDate: moment.Moment = moment().month(monthName);
        this.CurrentDate(this.CurrentDate().set("month", selectedMonthDate.month()));

        this.setSelectionState(DateTimePickerSelector.USER_SELECTING_DAY);
        this.repopulateCalendarDays();
    }

    /** Adds styles for current month in months panel on calendar */
    public MonthCss(monthName: string): string {
        var currentMonthName: string = this.MonthsShort[moment().month()];
        if (monthName == currentMonthName)
            return 'current-month';
        return '';
    }

    /** Shows the Month picker UI. */
    public ShowMonthPicker(): void {
        this.setSelectionState(DateTimePickerSelector.USER_SELECTING_MONTH);
    }

    /** Kills event propagation */
    public StopClickEventPropogation(data, e): void {
        e.stopImmediatePropagation();
    }

    /** Switches between the time & day picker. */
    public ToggleTimePicker(viewModel: DateTimePickerWidget, jqueryEvent: BaseJQueryEventObject) {
        if (!this.IsSelectingTime())
            this.setSelectionState(DateTimePickerSelector.USER_SELECTING_TIME);
        else {
            this.setSelectionState(DateTimePickerSelector.USER_SELECTING_DAY);
            this.repopulateCalendarDays();
        }
        jqueryEvent.stopImmediatePropagation();
    }

    /**
    * On Click of Calendar Icon.
    * Shows the calendar if display property is off, else it is hidden.
    * Triggering the document click, so that if any calendar is visible hiding the same.
    * Stopping further Propagation as it would continue further and hide other events.
    */
    public ToggleVisible(data, e): void {
        var isPickerVisible: boolean = this.IsVisible();
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
    }


    /** Compute function used to calculate display value for the main input box. */
    private calculateDisplayValue(): string {
        // Treat invalid dates as 'no selections'.
        if (!this.CurrentDate().isValid())
            return '';
        else if (this.CurrentDate().isAfter(moment()))
            return this.CanPickTime() ? moment().format('L') : moment().format('L');
        return this.CanPickTime() ? this.CurrentDate().format('L') : this.CurrentDate().format('L');
    }

    /** Computed function which calculates the display title of the date time picker. */
    private calculateTitle(): string {
        if (this.IsSelectingDay())
            return moment.months()[this.CurrentDate().month()] + ' ' + this.CurrentDate().year().toString();
        else if (this.IsSelectingMonth())
            return this.CurrentDate().year().toString();
        return '';
    }

    /**
    * Constrains a value (inclusively) between min and max. If the value is < min it'll roll over to max.
    * Similarly if value is > max it'll roll over to min.
    */
    private constrainToRange(min: number, max: number, value: number): number {
        if (value > max)
            return min + (value - max) - 1;
        else if (value < min)
            return max - (min - value) + 1;
        return value;
    }

    /** 
    * Repopulates the 2d grid of selectable dates in a month. Will properly pad out days
    * in previous & next month such that it fits nicely in a 7x6 grid.
    */
    private repopulateCalendarDays(): void {
        var momentArray: moment.Moment[][] = [[], [], [], [], [], []];
        var firstDayInMonth = this.CurrentDate().clone().startOf('month');

        var iStartingWeekDayNumber: number = firstDayInMonth.weekday();
        if (iStartingWeekDayNumber == 0)
            iStartingWeekDayNumber = 7;
        var startingDayInPreviousMonth = firstDayInMonth.add(-iStartingWeekDayNumber, 'd');

        var tempDay = startingDayInPreviousMonth;
        // Copy over the hours, minutes & seconds of the current date so that when the user selects the new date the time component is preserved.
        tempDay.hours(this.CurrentDate().hours());
        tempDay.minutes(this.CurrentDate().minutes());
        tempDay.seconds(this.CurrentDate().seconds());

        for (var indexRow: number = 0; indexRow < 6; indexRow++) {
            for (var indexColumn: number = 0; indexColumn < 7; indexColumn++) {
                var tempDayCloned = tempDay.clone();
                momentArray[indexRow].push(tempDayCloned);
                tempDay.add(1, "d");
            }
        }

        this.Dates(momentArray);
    }

    /** Sets the current user selection state */
    private setSelectionState(selectionSate: number) {
        this.selectionState(selectionSate);
    }

    /** Method to subscribe parent date */
    private subscribeParentDate(): void {
        var self = this;
        this.ParentDate.subscribe(function (newValue) {
            self.CurrentDate(newValue);
        }, self);
    }

    /** 
    * Restores the pages height property on DateTimePicker close
    * Value: 100% taken from Foundation Library.
    */
    public static RestorePageHeightOnClose(): void {
        $("body").css("height", "100%");
    }

    /**
    * Fix the body height to be the document's height so that the bodies dimensions take into account absolutely positioned
    * DateTimePicker popup.
    */
    public static FixPageHeightOnOpen(): void {
        $("body").css("height", $(document).height());
    }
}

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
$(document).click(function() {
    var visibleCalendars: any = jQuery(".datetimepicker:visible");
    var visibleCalendarsLength: number = visibleCalendars.length;
    if (visibleCalendarsLength > 0) {
        var contextData = ko.contextFor(visibleCalendars[0]);
        var classForContext: DateTimePickerWidget = contextData.$data;
        if (classForContext.CurrentDate().isAfter(moment()))
            classForContext.CurrentDate(moment());
        classForContext.ParentDate(classForContext.CurrentDate());
        classForContext.IsVisible(false);

        // When the DateTimePicker is hidden restore the height properties of the page to revert 
        // changes required for abs positioning.
        DateTimePickerWidget.RestorePageHeightOnClose();
    }
})