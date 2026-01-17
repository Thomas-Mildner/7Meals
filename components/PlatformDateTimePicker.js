import React, { forwardRef } from 'react';
import { Platform, View, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale/de';
import { Colors } from '../constants/Colors';

registerLocale('de', de);

export default function PlatformDateTimePicker(props) {
    if (Platform.OS === 'web') {
        const { value, onChange, style } = props;

        // Custom Input Component for React DatePicker
        const CustomInput = forwardRef(({ value, onClick }, ref) => (
            <Text
                onClick={onClick}
                ref={ref}
                style={{
                    color: Colors.text || '#fff',
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}
            >
                {value}
            </Text>
        ));

        return (
            <View style={[{
                backgroundColor: 'rgba(255,255,255,0.1)',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                alignSelf: 'flex-start',
                zIndex: 9999, // Ensure popup doesn't get clipped
            }, style]}>
                <DatePicker
                    selected={value || new Date()}
                    onChange={(date) => {
                        if (onChange) onChange({ type: 'set' }, date);
                    }}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Zeit"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"
                    locale="de"
                    customInput={<CustomInput />}
                    // Classnames for CSS styling (in _layout.js)
                    className="custom-datepicker-input"
                    calendarClassName="custom-datepicker-calendar"
                    popperClassName="custom-datepicker-popper"
                    popperPlacement="bottom-start"
                />
            </View>
        );
    }

    return <DateTimePicker {...props} />;
}
