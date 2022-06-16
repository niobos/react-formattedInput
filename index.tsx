import * as React from "react";  // JSX
import {useState} from "react";

export interface FormattedInputProps<T> {
    value: T
    formatValue?: (v: T) => string
    parseString?: (string) => T
    onChange?: (v: T) => void
    placeholder?: string
    disabled?: boolean
    style?: object
    styleFunc?: (v: T) => object
    className?: string
    classNameFunc?: (v: T) => string
}

export default function FormattedInput<T>(props: FormattedInputProps<T>) {
    const [text, setText] = useState<string|null>(null);

    const styleFunc = (props.styleFunc != null) ? props.styleFunc : () => {return {}};
    const classNameFunc = (props.classNameFunc != null) ? props.classNameFunc : () => '';

    const formatValue = props.formatValue != null ? props.formatValue : v => '' + v;
    const parseString = props.parseString != null ? props.parseString : s => s;

    const inputValue = text !== null
        ? text
        : formatValue(props.value);

    return <input
        type="text"
        placeholder={props.placeholder}
        disabled={props.disabled}
        value={inputValue}
        onChange={(e) => {
            setText(e.target.value);
            if(props.onChange != null) {
                props.onChange(parseString(e.target.value));
            }
        }}
        onFocus={() => setText(inputValue)}
        onBlur={() => setText(null)}
        style={{...props.style, ...styleFunc(props.value)}}
        className={props.className + ' ' + classNameFunc(props.value)}
    />;
}

export function parseValueFloat(
    s: string,
    {ignoreChars = /[ ]/g, decimalPoint = /[.,]/}:
        {ignoreChars?: RegExp, decimalPoint?: RegExp}
        = {},
): number {
    s = s.replace(ignoreChars, '');  // remove whitespace
    s = s.replace(decimalPoint, '.');  // JavaScript expects '.'
    if(s === "∞") return Infinity;

    const f = parseFloat(s);
    if(isNaN(f)) return 0;  // Needed to parse "." when starting to type ".5"
    return f;
}
export function formatValueFloat(
    value: number,
    {decimals = 3, thousandSep = '', decimalPoint = '.', explicitPlus = false}:
        {decimals?: number, thousandSep?: string, decimalPoint?: string, explicitPlus?: boolean}
        = {},
): string {
    if(value == Infinity) return "∞";

    // Heavily based on https://github.com/digitalbazaar/forge/blob/main/lib/util.js#L2339
    const sign = value < 0 ? '-' : (explicitPlus ? '+' : '');
    const s = Math.abs(value).toFixed(decimals);
    const intPart = parseInt(s, 10);
    const intPartStr = intPart + '';
    const j = (intPartStr.length > 3) ? (intPartStr.length % 3) : 0;
    return sign + (j ? intPartStr.substring(0, j) + thousandSep : '')
        + intPartStr.substring(j).replace(/(\d{3})(?=\d)/g, '$1' + thousandSep)
        + (decimals ? decimalPoint + (parseFloat(s) - intPart).toFixed(decimals)
            .slice(2).replace(/(\d{3})(?=\d)/g, '$1' + thousandSep) : '');
}

export function parseValuePercent(
    s: string
): number {
    return parseValueFloat(s) / 100;
}
export function formatValuePercent(
    value: number,
    {decimals = 2}:
        {decimals?: number}
        = {}
): string {
    return formatValueFloat(value * 100, {
        decimals,
    });
}
