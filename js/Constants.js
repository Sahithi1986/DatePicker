var DateTimePickerSelector = (function () {
    function DateTimePickerSelector() {
    }
    Object.defineProperty(DateTimePickerSelector, "USER_SELECTING_TIME", {
        /**
         *  Enum of Time Selection
         *  @returns {number} number for Time Selection
         */
        get: function () {
            return 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DateTimePickerSelector, "USER_SELECTING_DAY", {
        /**
         *  Enum of Day Selection
         *  @returns {number} number for Day Selection
         */
        get: function () {
            return 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DateTimePickerSelector, "USER_SELECTING_MONTH", {
        /**
         *  Enum of Day Selection
         *  @returns {number} number for Day Selection
         */
        get: function () {
            return 2;
        },
        enumerable: true,
        configurable: true
    });
    return DateTimePickerSelector;
})();
