import * as React from "react";  // JSX
import {useState} from "react";

export interface FormattedInputProps<T> {
    value: T
    formatValue?: (v: T) => string
    parseString?: (string) => T
    onChange?: (v: T) => void
    onFocus?: () => void
    onBlur?: () => void
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
        onFocus={() => {
            setText(inputValue);
            if(props.onFocus != null) props.onFocus();
        }}
        onBlur={() => {
            setText(null);
            if(props.onBlur != null) props.onBlur();
        }}
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

export function parseValueSi(
    s: string,
    {emptyValue = NaN}:
        {emptyValue?: number}
        = {},
): number | undefined {
    if(s == null || s === "") return emptyValue;

    const re = /^\s*(?<sign>[+-]?)(?<int_part>[0-9 ]*)(?:[.,](?<frac_part>[0-9 ]*))?([eE](?<exp_part>[+-]?\d+))? *(?<prefix>[EPTGMkmuµnpfa])?\s*$/
    const match = re.exec(s);
    if(match === null) return undefined;

    const sign_s = match.groups['sign'];
    let int_part_s = match.groups['int_part'] || "0";
    let frac_part_s = match.groups['frac_part'] || "0";
    let exp_part_s = match.groups['exp_part'] || "0";
    const prefix_s = match.groups['prefix'] || "";

    int_part_s = int_part_s.replace(' ', '');
    frac_part_s = frac_part_s.replace(' ', '');
    exp_part_s = exp_part_s.replace(' ', '');

    const sign = (sign_s === '-' ? -1 : 1);
    const int_part = parseInt(int_part_s);
    const frac_part = parseFloat("0." + frac_part_s);
    let exp_part = parseInt(exp_part_s);
    if(prefix_s === "") {
        // Do nothing
    } else {
        //         0123456789012
        const i = "EPTGMkmuµnpfa".indexOf(prefix_s);
        if(i <= 5) exp_part += 3*(6-i);
        else exp_part -= 3*(i-5);
    }

    return sign*(int_part + frac_part)*Math.pow(10, exp_part);
}
export function formatValueSi(
    value: number,
    {significantDigits = 3}:
        {significantDigits?: number}
        = {}
): string {
    // Based on https://github.com/ThomWright/format-si-prefix/blob/master/src/index.js MIT licensed
    const PREFIXES = {
        '24': 'Y',
        '21': 'Z',
        '18': 'E',
        '15': 'P',
        '12': 'T',
        '9': 'G',
        '6': 'M',
        '3': 'k',
        '0': '',
        '-3': 'm',
        '-6': 'µ',
        '-9': 'n',
        '-12': 'p',
        '-15': 'f',
        '-18': 'a',
        '-21': 'z',
        '-24': 'y'
    };
    if(value === null) return "";
    if(value === 0) return "0";
    let sig = Math.abs(value);  // significand
    let exponent = 0;
    while (sig >= 1000 && exponent < 24) {
        sig /= 1000;
        exponent += 3;
    }
    while (sig < 1 && exponent > -24) {
        sig *= 1000;
        exponent -= 3;
    }

    const signPrefix = value < 0 ? '-' : '';
    if (sig > 1000) { // exponent == 24
        // significand can be arbitrarily long
        return signPrefix + sig.toFixed(0) + ' ' + PREFIXES[exponent];
    }
    return signPrefix + parseFloat(sig.toPrecision(significantDigits)) + ' ' + PREFIXES[exponent];
}
