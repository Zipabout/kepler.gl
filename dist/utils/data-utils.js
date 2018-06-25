'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unique = unique;
exports.findMapBounds = findMapBounds;
exports.getLatLngBounds = getLatLngBounds;
exports.getSampleData = getSampleData;
exports.maybeToDate = maybeToDate;
exports.notNullorUndefined = notNullorUndefined;
exports.isPlainObject = isPlainObject;
exports.numberSort = numberSort;
exports.getSortingFunction = getSortingFunction;
exports.preciseRound = preciseRound;
exports.getRoundingDecimalFromStep = getRoundingDecimalFromStep;
exports.roundValToStep = roundValToStep;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _defaultSettings = require('../constants/default-settings');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * simple getting unique values of an array
 *
 * @param {array} values
 * @returns {array} unique values
 */
function unique(values) {
  var results = [];
  values.forEach(function (v) {
    if (!results.includes(v) && v !== null && v !== undefined) {
      results.push(v);
    }
  });

  return results;
}

/* eslint-disable max-statements */
/**
 * return center of map from given points
 * @param {array} layers
 * @param {string} dataId
 * @returns {object} coordinates of map center, empty if not found
 */
// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function findMapBounds(layers, dataId) {
  // find bounds in formatted layerData
  // use first isVisible Layer

  var newLayers = dataId ? layers.filter(function (l) {
    return l.config.dataId === dataId;
  }) : layers;
  var firstVisibleLayer = newLayers.find(function (l) {
    return l.config.isVisible;
  });
  if (!firstVisibleLayer) {
    return null;
  }

  // if first visible layer has bounds, use it
  if (firstVisibleLayer.meta && firstVisibleLayer.meta.bounds) {
    return firstVisibleLayer.meta.bounds;
  }

  // if not, find any layer that has bound
  var anyLayerWBound = newLayers.find(function (l) {
    return l.meta && l.meta.bounds;
  });

  return anyLayerWBound ? anyLayerWBound.meta.bounds : null;
}
/* eslint-enable max-statements */

function getLatLngBounds(points, idx, limit) {
  var lats = points.map(function (d) {
    return Array.isArray(d) && d[idx];
  }).filter(Number.isFinite).sort(numberSort);

  if (!lats.length) {
    return null;
  }
  // use 99 percentile to filter out outliers
  // clamp to limit
  return [Math.max(lats[Math.floor(0.01 * (lats.length - 1))], limit[0]), Math.min(lats[Math.ceil(0.99 * (lats.length - 1))], limit[1])];
}

function getSampleData(data) {
  var sampleSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;

  var sampleStep = Math.max(Math.floor(data.length / sampleSize), 1);
  var output = [];
  for (var i = 0; i < data.length; i += sampleStep) {
    output.push(data[i]);
  }

  return output;
}

function maybeToDate(isTime, fieldIdx, format, d) {
  if (isTime) {
    if (notNullorUndefined(d[fieldIdx])) {
      return typeof d[fieldIdx] === 'string' ? _moment2.default.utc(d[fieldIdx], format).valueOf() : format === 'x' ? d[fieldIdx] * 1000 : d[fieldIdx];
    }

    return null;
  }

  return d[fieldIdx];
}

function notNullorUndefined(d) {
  return d !== undefined && d !== null;
}

function isPlainObject(obj) {
  return obj === Object(obj) && typeof obj !== 'function' && !Array.isArray(obj);
}

function numberSort(a, b) {
  return a - b;
}

function getSortingFunction(fieldType) {
  switch (fieldType) {
    case _defaultSettings.ALL_FIELD_TYPES.real:
    case _defaultSettings.ALL_FIELD_TYPES.integer:
    case _defaultSettings.ALL_FIELD_TYPES.timestamp:
      return numberSort;
    default:
      return undefined;
  }
}

/**
 * round number with exact number of decimals
 * return as a string
 * @param {number} num
 * @param {number} decimals
 * @returns {string} - a rounded number in string format
 */
function preciseRound(num, decimals) {
  var t = Math.pow(10, decimals);
  return (Math.round(num * t + (decimals > 0 ? 1 : 0) * (Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
}

/**
 * get number of decimals to round to for slider from step
 * @param {number} step
 * @returns {number} - number of decimal
 */
function getRoundingDecimalFromStep(step) {
  if (isNaN(step)) {
    (0, _assert2.default)('step is not a number');
    (0, _assert2.default)(step);
  }

  var splitZero = step.toString().split('.');
  if (splitZero.length === 1) {
    return 0;
  }
  return splitZero[1].length;
}

/**
 * round the value to step for the slider
 * @param {number} minValue
 * @param {number} step
 * @param {number} val
 * @returns {number} - rounded number
 */
function roundValToStep(minValue, step, val) {
  if (isNaN(step)) {
    return val;
  }

  var decimal = getRoundingDecimalFromStep(step);
  var steps = Math.floor((val - minValue) / step);
  var remain = val - (steps * step + minValue);

  // has to round because javascript turns 0.1 into 0.9999999999999987
  remain = Number(preciseRound(remain, 8));

  var closest = void 0;
  if (remain === 0) {
    closest = val;
  } else if (remain < step / 2) {
    closest = steps * step + minValue;
  } else {
    closest = (steps + 1) * step + minValue;
  }

  // precise round return a string rounded to the defined decimal
  var rounded = preciseRound(closest, decimal);

  return Number(rounded);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9kYXRhLXV0aWxzLmpzIl0sIm5hbWVzIjpbInVuaXF1ZSIsImZpbmRNYXBCb3VuZHMiLCJnZXRMYXRMbmdCb3VuZHMiLCJnZXRTYW1wbGVEYXRhIiwibWF5YmVUb0RhdGUiLCJub3ROdWxsb3JVbmRlZmluZWQiLCJpc1BsYWluT2JqZWN0IiwibnVtYmVyU29ydCIsImdldFNvcnRpbmdGdW5jdGlvbiIsInByZWNpc2VSb3VuZCIsImdldFJvdW5kaW5nRGVjaW1hbEZyb21TdGVwIiwicm91bmRWYWxUb1N0ZXAiLCJ2YWx1ZXMiLCJyZXN1bHRzIiwiZm9yRWFjaCIsImluY2x1ZGVzIiwidiIsInVuZGVmaW5lZCIsInB1c2giLCJsYXllcnMiLCJkYXRhSWQiLCJuZXdMYXllcnMiLCJmaWx0ZXIiLCJsIiwiY29uZmlnIiwiZmlyc3RWaXNpYmxlTGF5ZXIiLCJmaW5kIiwiaXNWaXNpYmxlIiwibWV0YSIsImJvdW5kcyIsImFueUxheWVyV0JvdW5kIiwicG9pbnRzIiwiaWR4IiwibGltaXQiLCJsYXRzIiwibWFwIiwiQXJyYXkiLCJpc0FycmF5IiwiZCIsIk51bWJlciIsImlzRmluaXRlIiwic29ydCIsImxlbmd0aCIsIk1hdGgiLCJtYXgiLCJmbG9vciIsIm1pbiIsImNlaWwiLCJkYXRhIiwic2FtcGxlU2l6ZSIsInNhbXBsZVN0ZXAiLCJvdXRwdXQiLCJpIiwiaXNUaW1lIiwiZmllbGRJZHgiLCJmb3JtYXQiLCJtb21lbnQiLCJ1dGMiLCJ2YWx1ZU9mIiwib2JqIiwiT2JqZWN0IiwiYSIsImIiLCJmaWVsZFR5cGUiLCJBTExfRklFTERfVFlQRVMiLCJyZWFsIiwiaW50ZWdlciIsInRpbWVzdGFtcCIsIm51bSIsImRlY2ltYWxzIiwidCIsInBvdyIsInJvdW5kIiwic2lnbiIsInRvRml4ZWQiLCJzdGVwIiwiaXNOYU4iLCJzcGxpdFplcm8iLCJ0b1N0cmluZyIsInNwbGl0IiwibWluVmFsdWUiLCJ2YWwiLCJkZWNpbWFsIiwic3RlcHMi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T21DLFVBQVUsQ0FBVixFQUFhbkMsTUFBcEI7QUFDRDs7QUFFRDs7Ozs7OztBQU9PLFNBQVMvQixjQUFULENBQXdCcUUsUUFBeEIsRUFBa0NMLElBQWxDLEVBQXdDTSxHQUF4QyxFQUE2QztBQUNsRCxNQUFJTCxNQUFNRCxJQUFOLENBQUosRUFBaUI7QUFDZixXQUFPTSxHQUFQO0FBQ0Q7O0FBRUQsTUFBTUMsVUFBVXhFLDJCQUEyQmlFLElBQTNCLENBQWhCO0FBQ0EsTUFBTVEsUUFBUXhDLEtBQUtFLEtBQUwsQ0FBVyxDQUFDb0MsTUFBTUQsUUFBUCxJQUFtQkwsSUFBOUIsQ0FBZDtBQUNBLE1BQUlTLFNBQVNILE9BQU9FLFFBQVFSLElBQVIsR0FBZUssUUFBdEIsQ0FBYjs7QUFFQTtBQUNBSSxXQUFTN0MsT0FBTzlCLGFBQWEyRSxNQUFiLEVBQXFCLENBQXJCLENBQVAsQ0FBVDs7QUFFQSxNQUFJQyxnQkFBSjtBQUNBLE1BQUlELFdBQVcsQ0FBZixFQUFrQjtBQUNoQkMsY0FBVUosR0FBVjtBQUNELEdBRkQsTUFFTyxJQUFJRyxTQUFTVCxPQUFPLENBQXBCLEVBQXVCO0FBQzVCVSxjQUFVRixRQUFRUixJQUFSLEdBQWVLLFFBQXpCO0FBQ0QsR0FGTSxNQUVBO0FBQ0xLLGNBQVUsQ0FBQ0YsUUFBUSxDQUFULElBQWNSLElBQWQsR0FBcUJLLFFBQS9CO0FBQ0Q7O0FBRUQ7QUFDQSxNQUFNTSxVQUFVN0UsYUFBYTRFLE9BQWIsRUFBc0JILE9BQXRCLENBQWhCOztBQUVBLFNBQU8zQyxPQUFPK0MsT0FBUCxDQUFQO0FBQ0QiLCJmaWxlIjoiZGF0YS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxOCBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7QUxMX0ZJRUxEX1RZUEVTfSBmcm9tICdjb25zdGFudHMvZGVmYXVsdC1zZXR0aW5ncyc7XG5cbi8qKlxuICogc2ltcGxlIGdldHRpbmcgdW5pcXVlIHZhbHVlcyBvZiBhbiBhcnJheVxuICpcbiAqIEBwYXJhbSB7YXJyYXl9IHZhbHVlc1xuICogQHJldHVybnMge2FycmF5fSB1bmlxdWUgdmFsdWVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmlxdWUodmFsdWVzKSB7XG4gIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godiA9PiB7XG4gICAgaWYgKCFyZXN1bHRzLmluY2x1ZGVzKHYpICYmIHYgIT09IG51bGwgJiYgdiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXN1bHRzLnB1c2godik7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbi8qKlxuICogcmV0dXJuIGNlbnRlciBvZiBtYXAgZnJvbSBnaXZlbiBwb2ludHNcbiAqIEBwYXJhbSB7YXJyYXl9IGxheWVyc1xuICogQHBhcmFtIHtzdHJpbmd9IGRhdGFJZFxuICogQHJldHVybnMge29iamVjdH0gY29vcmRpbmF0ZXMgb2YgbWFwIGNlbnRlciwgZW1wdHkgaWYgbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTWFwQm91bmRzKGxheWVycywgZGF0YUlkKSB7XG4gIC8vIGZpbmQgYm91bmRzIGluIGZvcm1hdHRlZCBsYXllckRhdGFcbiAgLy8gdXNlIGZpcnN0IGlzVmlzaWJsZSBMYXllclxuXG4gIGNvbnN0IG5ld0xheWVycyA9IGRhdGFJZFxuICAgID8gbGF5ZXJzLmZpbHRlcihsID0+IGwuY29uZmlnLmRhdGFJZCA9PT0gZGF0YUlkKVxuICAgIDogbGF5ZXJzO1xuICBjb25zdCBmaXJzdFZpc2libGVMYXllciA9IG5ld0xheWVycy5maW5kKGwgPT4gbC5jb25maWcuaXNWaXNpYmxlKTtcbiAgaWYgKCFmaXJzdFZpc2libGVMYXllcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gaWYgZmlyc3QgdmlzaWJsZSBsYXllciBoYXMgYm91bmRzLCB1c2UgaXRcbiAgaWYgKGZpcnN0VmlzaWJsZUxheWVyLm1ldGEgJiYgZmlyc3RWaXNpYmxlTGF5ZXIubWV0YS5ib3VuZHMpIHtcbiAgICByZXR1cm4gZmlyc3RWaXNpYmxlTGF5ZXIubWV0YS5ib3VuZHM7XG4gIH1cblxuICAvLyBpZiBub3QsIGZpbmQgYW55IGxheWVyIHRoYXQgaGFzIGJvdW5kXG4gIGNvbnN0IGFueUxheWVyV0JvdW5kID0gbmV3TGF5ZXJzLmZpbmQobCA9PiBsLm1ldGEgJiYgbC5tZXRhLmJvdW5kcyk7XG5cbiAgcmV0dXJuIGFueUxheWVyV0JvdW5kID8gYW55TGF5ZXJXQm91bmQubWV0YS5ib3VuZHMgOiBudWxsO1xufVxuLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGF0TG5nQm91bmRzKHBvaW50cywgaWR4LCBsaW1pdCkge1xuICBjb25zdCBsYXRzID0gcG9pbnRzXG4gICAgLm1hcChkID0+IEFycmF5LmlzQXJyYXkoZCkgJiYgZFtpZHhdKVxuICAgIC5maWx0ZXIoTnVtYmVyLmlzRmluaXRlKVxuICAgIC5zb3J0KG51bWJlclNvcnQpO1xuXG4gIGlmICghbGF0cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyB1c2UgOTkgcGVyY2VudGlsZSB0byBmaWx0ZXIgb3V0IG91dGxpZXJzXG4gIC8vIGNsYW1wIHRvIGxpbWl0XG4gIHJldHVybiBbXG4gICAgTWF0aC5tYXgobGF0c1tNYXRoLmZsb29yKDAuMDEgKiAobGF0cy5sZW5ndGggLSAxKSldLCBsaW1pdFswXSksXG4gICAgTWF0aC5taW4obGF0c1tNYXRoLmNlaWwoMC45OSAqIChsYXRzLmxlbmd0aCAtIDEpKV0sIGxpbWl0WzFdKVxuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2FtcGxlRGF0YShkYXRhLCBzYW1wbGVTaXplID0gNTAwKSB7XG4gIGNvbnN0IHNhbXBsZVN0ZXAgPSBNYXRoLm1heChNYXRoLmZsb29yKGRhdGEubGVuZ3RoIC8gc2FtcGxlU2l6ZSksIDEpO1xuICBjb25zdCBvdXRwdXQgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSArPSBzYW1wbGVTdGVwKSB7XG4gICAgb3V0cHV0LnB1c2goZGF0YVtpXSk7XG4gIH1cblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF5YmVUb0RhdGUoaXNUaW1lLCBmaWVsZElkeCwgZm9ybWF0LCBkKSB7XG4gIGlmIChpc1RpbWUpIHtcbiAgICBpZiAobm90TnVsbG9yVW5kZWZpbmVkKGRbZmllbGRJZHhdKSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBkW2ZpZWxkSWR4XSA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBtb21lbnQudXRjKGRbZmllbGRJZHhdLCBmb3JtYXQpLnZhbHVlT2YoKVxuICAgICAgICA6IGZvcm1hdCA9PT0gJ3gnID8gZFtmaWVsZElkeF0gKiAxMDAwIDogZFtmaWVsZElkeF07XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gZFtmaWVsZElkeF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3ROdWxsb3JVbmRlZmluZWQoZCkge1xuICByZXR1cm4gZCAhPT0gdW5kZWZpbmVkICYmIGQgIT09IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuICByZXR1cm4gKFxuICAgIG9iaiA9PT0gT2JqZWN0KG9iaikgJiYgdHlwZW9mIG9iaiAhPT0gJ2Z1bmN0aW9uJyAmJiAhQXJyYXkuaXNBcnJheShvYmopXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBudW1iZXJTb3J0KGEsIGIpIHtcbiAgcmV0dXJuIGEgLSBiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U29ydGluZ0Z1bmN0aW9uKGZpZWxkVHlwZSkge1xuICBzd2l0Y2ggKGZpZWxkVHlwZSkge1xuICAgIGNhc2UgQUxMX0ZJRUxEX1RZUEVTLnJlYWw6XG4gICAgY2FzZSBBTExfRklFTERfVFlQRVMuaW50ZWdlcjpcbiAgICBjYXNlIEFMTF9GSUVMRF9UWVBFUy50aW1lc3RhbXA6XG4gICAgICByZXR1cm4gbnVtYmVyU29ydDtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIHJvdW5kIG51bWJlciB3aXRoIGV4YWN0IG51bWJlciBvZiBkZWNpbWFsc1xuICogcmV0dXJuIGFzIGEgc3RyaW5nXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtXG4gKiBAcGFyYW0ge251bWJlcn0gZGVjaW1hbHNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gYSByb3VuZGVkIG51bWJlciBpbiBzdHJpbmcgZm9ybWF0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVjaXNlUm91bmQobnVtLCBkZWNpbWFscykge1xuICBjb25zdCB0ID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcbiAgcmV0dXJuIChcbiAgICBNYXRoLnJvdW5kKFxuICAgICAgbnVtICogdCArXG4gICAgICAgIChkZWNpbWFscyA+IDAgPyAxIDogMCkgKlxuICAgICAgICAgIChNYXRoLnNpZ24obnVtKSAqICgxMCAvIE1hdGgucG93KDEwMCwgZGVjaW1hbHMpKSlcbiAgICApIC8gdFxuICApLnRvRml4ZWQoZGVjaW1hbHMpO1xufVxuXG4vKipcbiAqIGdldCBudW1iZXIgb2YgZGVjaW1hbHMgdG8gcm91bmQgdG8gZm9yIHNsaWRlciBmcm9tIHN0ZXBcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGVwXG4gKiBAcmV0dXJucyB7bnVtYmVyfSAtIG51bWJlciBvZiBkZWNpbWFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb3VuZGluZ0RlY2ltYWxGcm9tU3RlcChzdGVwKSB7XG4gIGlmIChpc05hTihzdGVwKSkge1xuICAgIGFzc2VydCgnc3RlcCBpcyBub3QgYSBudW1iZXInKTtcbiAgICBhc3NlcnQoc3RlcCk7XG4gIH1cblxuICBjb25zdCBzcGxpdFplcm8gPSBzdGVwLnRvU3RyaW5nKCkuc3BsaXQoJy4nKTtcbiAgaWYgKHNwbGl0WmVyby5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICByZXR1cm4gc3BsaXRaZXJvWzFdLmxlbmd0aDtcbn1cblxuLyoqXG4gKiByb3VuZCB0aGUgdmFsdWUgdG8gc3RlcCBmb3IgdGhlIHNsaWRlclxuICogQHBhcmFtIHtudW1iZXJ9IG1pblZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0gc3RlcFxuICogQHBhcmFtIHtudW1iZXJ9IHZhbFxuICogQHJldHVybnMge251bWJlcn0gLSByb3VuZGVkIG51bWJlclxuICovXG5leHBvcnQgZnVuY3Rpb24gcm91bmRWYWxUb1N0ZXAobWluVmFsdWUsIHN0ZXAsIHZhbCkge1xuICBpZiAoaXNOYU4oc3RlcCkpIHtcbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgY29uc3QgZGVjaW1hbCA9IGdldFJvdW5kaW5nRGVjaW1hbEZyb21TdGVwKHN0ZXApO1xuICBjb25zdCBzdGVwcyA9IE1hdGguZmxvb3IoKHZhbCAtIG1pblZhbHVlKSAvIHN0ZXApO1xuICBsZXQgcmVtYWluID0gdmFsIC0gKHN0ZXBzICogc3RlcCArIG1pblZhbHVlKTtcblxuICAvLyBoYXMgdG8gcm91bmQgYmVjYXVzZSBqYXZhc2NyaXB0IHR1cm5zIDAuMSBpbnRvIDAuOTk5OTk5OTk5OTk5OTk4N1xuICByZW1haW4gPSBOdW1iZXIocHJlY2lzZVJvdW5kKHJlbWFpbiwgOCkpO1xuXG4gIGxldCBjbG9zZXN0O1xuICBpZiAocmVtYWluID09PSAwKSB7XG4gICAgY2xvc2VzdCA9IHZhbDtcbiAgfSBlbHNlIGlmIChyZW1haW4gPCBzdGVwIC8gMikge1xuICAgIGNsb3Nlc3QgPSBzdGVwcyAqIHN0ZXAgKyBtaW5WYWx1ZTtcbiAgfSBlbHNlIHtcbiAgICBjbG9zZXN0ID0gKHN0ZXBzICsgMSkgKiBzdGVwICsgbWluVmFsdWU7XG4gIH1cblxuICAvLyBwcmVjaXNlIHJvdW5kIHJldHVybiBhIHN0cmluZyByb3VuZGVkIHRvIHRoZSBkZWZpbmVkIGRlY2ltYWxcbiAgY29uc3Qgcm91bmRlZCA9IHByZWNpc2VSb3VuZChjbG9zZXN0LCBkZWNpbWFsKTtcblxuICByZXR1cm4gTnVtYmVyKHJvdW5kZWQpO1xufVxuIl19