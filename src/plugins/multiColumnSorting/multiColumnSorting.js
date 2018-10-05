import ColumnSorting from 'handsontable/plugins/columnSorting/columnSorting';
import { registerPlugin } from 'handsontable/plugins';
import { isPressedCtrlKey } from 'handsontable/utils/keyStateObserver';
import { mainSortComparator } from './comparatorEngine';
import { DomHelper } from './domHelper';
import './multiColumnSorting.css';

const APPEND_COLUMN_CONFIG_STRATEGY = 'append';
const PLUGIN_KEY = 'multiColumnSorting';

/**
 * @plugin MultiColumnSorting
 * @pro
 *
 * @description
 * This plugin sorts the view by columns (but does not sort the data source!). To enable the plugin, set the
 * {@link Options#multiColumnSorting} property to the correct value (see the examples below).
 *
 * @example
 * ```js
 * // as boolean
 * multiColumnSorting: true
 *
 * // as an object with initial sort config (sort ascending for column at index 1 and then sort descending for column at index 0)
 * multiColumnSorting: {
 *   initialConfig: [{
 *     column: 1,
 *     sortOrder: 'asc'
 *   }, {
 *     column: 0,
 *     sortOrder: 'desc'
 *   }]
 * }
 *
 * // as an object which define specific sorting options for all columns
 * multiColumnSorting: {
 *   sortEmptyCells: true, // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table (by default)
 *   indicator: true, // true = shows indicator for all columns (by default), false = don't show indicator for columns
 *   headerAction: true, // true = allow to click on the headers to sort (by default), false = turn off possibility to click on the headers to sort
 *   compareFunctionFactory: function(sortOrder, columnMeta) {
 *     return function(value, nextValue) {
 *       // Some value comparisons which will return -1, 0 or 1...
 *     }
 *   }
 * }
 *
 * // as an object passed to the `column` property, allows specifying a custom options for the desired column.
 * // please take a look at documentation of `column` property: https://docs.handsontable.com/pro/Options.html#columns
 * columns: [{
 *   multiColumnSorting: {
 *     indicator: false, // disable indicator for the first column,
 *     sortEmptyCells: true,
 *     headerAction: false, // clicks on the first column won't sort
 *     compareFunctionFactory: function(sortOrder, columnMeta) {
 *       return function(value, nextValue) {
 *         return 0; // Custom compare function for the first column (don't sort)
 *       }
 *     }
 *   }
 * }]```
 *
 * @dependencies ObserveChanges moment
 */
class MultiColumnSorting extends ColumnSorting {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Main settings key designed for the plugin.
     *
     * @private
     * @type {String}
     */
    this.pluginKey = PLUGIN_KEY;
    /**
     * Main sort comparator which is passed to the sort function.
     *
     * @private
     * @type {Function}
     */
    this.mainSortComparator = mainSortComparator;
    /**
     * Instance of DOM helper.
     *
     * @private
     * @type {DomHelper}
     */
    this.domHelper = new DomHelper(this.columnStatesManager);
  }

  /**
   * Sorts the table by chosen columns and orders.
   *
   * @param {undefined|Object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   *
   * **Note**: Please keep in mind that every call of `sort` function set an entirely new sort order. Previous sort configs aren't preserved.
   *
   * @example
   * ```js
   * // sort ascending first visual column
   * hot.getPlugin('multiColumnSorting').sort({ column: 0, sortOrder: 'asc' });
   *
   * // sort first two visual column in the defined sequence
   * hot.getPlugin('multiColumnSorting').sort([{
   *   column: 1, sortOrder: 'asc'
   * }, {
   *   column: 0, sortOrder: 'desc'
   * }]);
   * ```
   *
   * @fires Hooks#beforeColumnSort
   * @fires Hooks#afterColumnSort
   */
  sort(sortConfig) {
    return super.sort(sortConfig);
  }

  /**
   * Clear the sort performed on the table.
   */
  clearSort() {
    return super.clearSort();
  }

  /**
   * Checks if the table is sorted (any column have to be sorted).
   *
   * @returns {Boolean}
   */
  isSorted() {
    return super.isSorted();
  }

  /**
   * Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.
   *
   * @param {Number} [column] Visual column index.
   * @returns {undefined|Object|Array}
   */
  getSortConfig(column) {
    return super.getSortConfig(column);
  }

  /**
   * @description
   * Warn: Useful mainly for providing server side sort implementation (see in the example below). It doesn't sort the data set. It just sets sort configuration for all sorted columns.
   *
   * @example
   * ```js
   * beforeColumnSort: function(currentSortConfig, destinationSortConfigs) {
   *   const columnSortPlugin = this.getPlugin('multiColumnSorting');
   *
   *   columnSortPlugin.setSortConfig(destinationSortConfigs);
   *
   *   // const newData = ... // Calculated data set, ie. from an AJAX call.
   *
   *   // this.loadData(newData); // Load new data set.
   *
   *   return false; // The blockade for the default sort action.
   * }```
   *
   * @param {undefined|Object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
   * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
   * sort order (`asc` for ascending, `desc` for descending).
   */
  setSortConfig(sortConfig) {
    return super.setSortConfig(sortConfig);
  }

  /**
   * Callback for the `onAfterOnCellMouseDown` hook.
   *
   * @private
   * @param {Event} event Event which are provided by hook.
   * @param {CellCoords} coords Visual coords of the selected cell.
   */
  onAfterOnCellMouseDown(event, coords) {
    // Click below the level of column headers
    if (coords.row >= 0 || coords.col < 0) {
      return;
    }

    if (this.wasClickableHeaderClicked(event, coords.col)) {
      if (isPressedCtrlKey()) {
        this.hot.deselectCell();
        this.hot.selectColumns(coords.col);

        this.sort(this.getNextSortConfig(coords.col, APPEND_COLUMN_CONFIG_STRATEGY));

      } else {
        this.sort(this.getColumnNextConfig(coords.col));
      }
    }
  }
}

registerPlugin(PLUGIN_KEY, MultiColumnSorting);

export default MultiColumnSorting;
