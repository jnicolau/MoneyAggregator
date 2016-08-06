/**
 * Created by joao on 05/08/2016.
 */

app.service('mockService', [function (airtricity, virginMedia, aib) {

    var statements = [{
        "Description": "VDA-BANK OF IRELANDUNDRUM           27JUL16 18:06",
        "Date": "2016-07-29",
        "Amount": -200,
        "Category": "ATM"
    }, {
        "Description": "VDP-TESCO STORE 35",
        "Date": "2016-07-28",
        "Amount": -57.54,
        "Category": "Groceries"
    }, {
        "Description": "*MOBI FAMILY",
        "Date": "2016-07-15",
        "Amount": -50,
        "Category": "Transfer"
    }, {
        "Description": "*MOBI JERRY",
        "Date": "2016-07-09",
        "Amount": -20,
        "Category": "Transfer"
    }, {
        "Description": "VDC-GREEN BENCH CA",
        "Date": "2016-06-29",
        "Amount": -5.5,
        "Category": "Food & Dining"
    }, {
        "Description": "*INET CURRENT-084",
        "Date": "2016-06-28",
        "Amount": 1776.84,
        "Category": "Transfers & Lodgements"
    }, {
        "Description": "OLIVE SITUATIONS",
        "Date": "2016-06-27",
        "Amount": 4120.01,
        "Category": "Income"
    }, {
        "Description": "SEPA OUTWARD      CT0DPC109M08U6JXVT",
        "Date": "2016-06-16",
        "Amount": 3664.95,
        "Category": "Income"
    }, {
        "Description": "VDP-PAYPAL *FREELA",
        "Date": "2016-06-15",
        "Amount": -3.17,
        "Category": "Professional Services"
    }, {
        "Description": "VDP-PAYPAL *FREELA",
        "Date": "2016-06-14",
        "Amount": -24.32,
        "Category": "Professional Services"
    }, {
        "Description": "VDC-GREEN BENCH CA",
        "Date": "2016-06-13",
        "Amount": -6.5,
        "Category": "Food & Dining"
    }];

    return {
        statements: statements
    }
    }]);