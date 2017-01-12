/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain a copy
 * of the license at https://github.com/palantir/blueprint/blob/master/LICENSE
 * and https://github.com/palantir/blueprint/blob/master/PATENTS
 */

import * as moment from "moment";
import * as React from "react";

import {
    AbstractComponent,
    Button,
    Classes,
    InputGroup,
    Intent,
    IProps,
    Popover,
    Position,
} from "@blueprintjs/core";

import { DateRange } from "./common/dateUtils";
import {
    getDefaultMaxDate,
    getDefaultMinDate,
    IDatePickerBaseProps,
} from "./datePickerCore";
import { DateRangePicker } from "./dateRangePicker";

export interface IDateRangeInputProps extends IDatePickerBaseProps, IProps {
    /**
     * Whether the start and end dates of the range can be the same day.
     * If `true`, clicking a selected date will create a one-day range.
     * If `false`, clicking a selected date will clear the selection.
     * @default false
     */
    allowSingleDayRange?: boolean;

    /**
     * Whether the component should be enabled or disabled.
     * @default false
     */
    disabled?: boolean;

    /**
     * Initial DateRange the calendar will display as selected.
     * This should not be set if `value` is set.
     */
    defaultValue?: DateRange;

    /**
     * The format of the date. See options
     * here: http://momentjs.com/docs/#/displaying/format/
     * @default "YYYY-MM-DD"
     */
    format?: string;

    /**
     * The error message to display when the date selected invalid.
     * @default "Invalid date"
     */
    invalidDateRangeMessage?: string;

    /**
     * Called when the user selects a day.
     * If no days are selected, it will pass `[null, null]`.
     * If a start date is selected but not an end date, it will pass `[selectedDate, null]`.
     * If both a start and end date are selected, it will pass `[startDate, endDate]`.
     */
    onChange?: (selectedDates: DateRange) => void;

    /**
     * Called when the user finishes typing in a new date and the date causes an error state.
     * If the date is invalid, `new Date(undefined)` will be returned. If the date is out of range,
     * the out of range date will be returned (`onChange` is not called in this case).
     */
    onError?: (errorDate: Date) => void;

    /**
     * If true, the Popover will open when the user clicks on the input. If false, the Popover will only
     * open when the calendar icon is clicked.
     * @default true
     */
    openOnFocus?: boolean;

    /**
     * The error message to display when the date selected is out of range.
     * @default "Out of range"
     */
    outOfRangeMessage?: string;

    /**
     * The position the date popover should appear in relative to the input box.
     * @default Position.BOTTOM
     */
    popoverPosition?: Position;

    /**
     * Whether shortcuts to quickly select a range of dates are displayed or not.
     * If `true`, preset shortcuts will be displayed.
     * If `false`, no shortcuts will be displayed.
     * If an array, the custom shortcuts provided will be displayed.
     * @default true
     */
    // shortcuts?: boolean | IDateRangeShortcut[];

    /**
     * The currently selected DateRange.
     * If this prop is present, the component acts in a controlled manner.
     */
    value?: DateRange;
}

export interface IDateRangeInputState {
    isInputFocused?: boolean;
    isOpen?: boolean;
    value?: DateRange;
    valueString?: string;
}

export class DateRangeInput extends AbstractComponent<IDateRangeInputProps, IDateRangeInputState> {
    public static defaultProps: IDateRangeInputProps = {
        allowSingleDayRange: false,
        disabled: false,
        format: "YYYY-MM-DD",
        invalidDateRangeMessage: "Invalid date range",
        maxDate: getDefaultMaxDate(),
        minDate: getDefaultMinDate(),
        openOnFocus: true,
        outOfRangeMessage: "Out of range",
        popoverPosition: Position.BOTTOM_LEFT,
    };

    public displayName = "Blueprint.DateRangeInput";

    private inputRef: HTMLElement = null;

    public constructor(props: IDateRangeInputProps, context?: any) {
        super(props, context);

        this.state = {
            isInputFocused: false,
            isOpen: false,
            value: null,
            valueString: null,
        };
    }

    public render() {
        const { format } = this.props;

        const dateRangeString = this.state.isInputFocused
             ? this.state.valueString
             : this.getDateRangeString(this.state.value);

        const popoverContent = (
            <DateRangePicker
                allowSingleDayRange={this.props.allowSingleDayRange}
                onChange={this.handleDateRangeChange}
                value={this.state.value}
            />
        );

        const calendarIcon = (
            <Button
                className={Classes.MINIMAL}
                disabled={this.props.disabled}
                iconName="calendar"
                intent={Intent.PRIMARY}
                onClick={this.handleIconClick}
            />
        );

        return (
            <Popover
                autoFocus={false}
                content={popoverContent}
                enforceFocus={false}
                inline={true}
                isOpen={this.state.isOpen}
                onClose={this.handleClosePopover}
                popoverClassName="pt-daterangeinput-popover"
                position={this.props.popoverPosition}
            >
                <InputGroup
                    className={"pt-daterangeinput"}
                    disabled={this.props.disabled}
                    inputRef={this.setInputRef}
                    type="text"
                    onBlur={this.handleInputBlur}
                    onChange={this.handleInputChange}
                    onClick={this.handleInputClick}
                    onFocus={this.handleInputFocus}
                    placeholder={`${format} - ${format}`}
                    rightElement={calendarIcon}
                    value={dateRangeString}
                />
            </Popover>
        );
    }

    // Helper functions
    // ================

    private dateIsInRange(value: moment.Moment) {
        return value.isBetween(this.props.minDate, this.props.maxDate, "day", "[]");
    }

    private getDateRangeString = (value: DateRange) => {
        if (value == null) {
            return "";
        }

        const startDate = value[0];
        const endDate = value[1];

        const startDateFormatted = this.formatDate(startDate);
        const endDateFormatted = this.formatDate(endDate);

        let dateRangeString: string;

        if (startDate != null && endDate != null) {
            dateRangeString = `${startDateFormatted} - ${endDateFormatted}`;
        } else if (startDate != null) {
            dateRangeString = `${startDateFormatted} - `;
        } else if (endDate != null) {
            dateRangeString = ` - ${endDateFormatted}`;
        } else {
            dateRangeString = "";
        }

        return dateRangeString;
    }

    private formatDate = (date: Date) => {
        if (date == null) {
            return "";
        }
        return moment(date).format(this.props.format);
    }

    private setInputRef = (el: HTMLElement) => {
        this.inputRef = el;
    }

    private validAndInRange(value: moment.Moment) {
        return value != null && value.isValid() && this.dateIsInRange(value);
    }

    private valueStringToMomentDateRange(valueString: string) {
        return valueString.split("-") // TODO: make separator(s) parameterizable
            .map((token) => token.trim())
            .map((token) => (token.length > 0) ? token : null)
            .map((token) => (token != null) ? moment(token, this.props.format) : null);
    }

    private momentDateRangeToDateRange(dateRange: moment.Moment[]) {
        return [
            (dateRange[0] != null) ? dateRange[0].toDate() : null,
            (dateRange[1] != null) ? dateRange[1].toDate() : null,
        ] as DateRange;
    }

    private dateRangeToString(dateRange: DateRange) {
        const startDateFormatted = this.formatDate(dateRange[0]);
        const endDateFormatted = this.formatDate(dateRange[1]);
        return `${startDateFormatted} - ${endDateFormatted}`; // TODO: Use parameterizable separator
    }

    // Callbacks - DateRangePicker
    // ===========================

    private handleDateRangeChange = (dateRange: DateRange) => {
        this.setState({ value: dateRange });
    }

    // Callbacks - Popover
    // ===================

    private handleClosePopover = () => {
        this.setState({ isOpen: false });
    }

    // Callbacks - Button
    // ==================

    private handleIconClick = (e: React.SyntheticEvent<HTMLElement>) => {
        if (this.state.isOpen) {
            if (this.inputRef != null) {
                this.inputRef.blur();
            }
        } else {
            this.setState({ isOpen: true });
            e.stopPropagation();
            if (this.inputRef != null) {
                this.inputRef.focus();
            }
        }
    }

    // Callbacks - InputGroup
    // ======================

    private handleInputBlur = () => {
        const valueString = this.state.valueString;
        const dateRange = this.valueStringToMomentDateRange(valueString);
        const [startDate, endDate] = dateRange;

        if (valueString.length > 0
            && valueString !== this.getDateRangeString(this.state.value)
            && (!this.validAndInRange(startDate) || !this.validAndInRange(endDate))) {

            if (this.props.value === undefined) {
                this.setState({
                    isInputFocused: false,
                    value: this.momentDateRangeToDateRange(dateRange) as DateRange,
                    valueString: null,
                });
            } else {
                this.setState({ isInputFocused: false });
            }

            // TODO: Trigger onError and onChange callbacks
        }

        this.setState({ isInputFocused: false });
    }

    private handleInputChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const valueString = (e.target as HTMLInputElement).value;

        const dateRange = this.valueStringToMomentDateRange(valueString);
        const [startDate, endDate] = dateRange;

        if (startDate == null || dateRange.length > 2) {
            this.setState({ valueString });
        } else {
            const validatedDateRange = [
                this.validAndInRange(startDate) ? startDate.toDate() : null,
                this.validAndInRange(endDate) ? endDate.toDate() : null,
            ];

            if (this.props.value === undefined) {
                this.setState({ value: validatedDateRange as DateRange, valueString });
            } else {
                this.setState({ valueString });
            }
        }
    }

    private handleInputClick = (e: React.SyntheticEvent<HTMLInputElement>) => {
        if (this.props.openOnFocus) {
            e.stopPropagation();
        }
    }

    private handleInputFocus = () => {
        const valueString = (this.state.value == null)
            ? ""
            : this.dateRangeToString(this.state.value);

        if (this.props.openOnFocus) {
            this.setState({ isInputFocused: true, isOpen: true, valueString });
        } else {
            this.setState({ isInputFocused: true, valueString });
        }
    }
}
