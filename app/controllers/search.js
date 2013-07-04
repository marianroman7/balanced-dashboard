Balanced.SearchController = Balanced.ObjectController.extend(Balanced.DownloadControllerMixin, {
    needs: ['marketplace'],

    search: '',

    limit: 10,
    minDate: null,
    maxDate: null,
    sortField: null,
    sortOrder: null,
    type: 'transactions',

    // Using a two-level system for the results content here because we don't
    // want to lose our results while we're loading a new query
    // The currently processing query is computed as loading_content, once it
    // has loaded successfully, it's set as content
    loading_content: function() {
        var query = this.get('search');
        var marketplaceUri = this.get('controllers').get('marketplace').get('uri');

        if (!query || !query.trim()) {
            return null;
        }

        // Allows users to get all results by entering wildcard (%)
        if (query === '%') {
            query = '';
        }

        var self = this;
        var params = this.searchParams({
            query: query
        });

        var searchQuery = Balanced.SearchQuery.search(marketplaceUri, params);

        searchQuery.then(function(searchQuery) {
            self.set('content', searchQuery);
        });

        return searchQuery;
    }.property('search', 'limit', 'minDate', 'maxDate', 'sortField', 'sortOrder', 'type'),

    isLoading: function() {
        var current = this.get('loading_content');
        return current && !current.get('isLoaded');
    }.property('loading_content.isLoaded'),

    getLabel: function (labelMapping, acceptedTypes, type) {
        var label = labelMapping[type];
        if (!label && acceptedTypes.indexOf(type) > -1) {
            label = Balanced.Utils.toTitleCase(type.replace('_', ' ')) + 's';
        }
        return (label) ? label : labelMapping.DEFAULT;
    },

    transaction_type: function () {
        var types = ['debit', 'credit', 'hold', 'refund', 'transactions'];
        return types.indexOf(this.type) > -1 ? 'transactions' : null;
    }.property('content.type'),

    transaction_type_label: function () {
        var typesToLabels = {
            DEFAULT: 'Transactions'
        };
        var types = ['debit', 'credit', 'hold', 'refund'];
        return this.getLabel(typesToLabels, types, this.type);
    }.property('content.type'),

    transaction_type_total: function () {
        var types = ['debit', 'credit', 'hold', 'refund'];
        var type = this.get('type');
        return (types.indexOf(type) >= 0 && this.get('total_{0}s'.format(type))) || this.get('total_transactions');
    }.property('content.uri'),

    funding_instrument_type_label: function () {
        var typesToLabels = {
            DEFAULT: 'Cards & Bank Accounts'
        };
        var types = ['bank_account', 'card'];
        return this.getLabel(typesToLabels, types, this.type);
    }.property('content.type'),

    getSearchUri: function () {
        var query = this.get('search');
        var marketplaceUri = this.get('controllers').get('marketplace').get('uri');
        var params = this.searchParams({
            query: query
        });
        return Balanced.SearchQuery.createUri(marketplaceUri, params);
    },

    loadMore: function(results) {
        results.loadNextPage();
    },

    searchParams: function (params) {
        var defaults = {
            limit: this.get('limit'),
            minDate: this.get('minDate'),
            maxDate: this.get('maxDate'),
            sortField: this.get('sortField'),
            sortOrder: this.get('sortOrder'),
            type: this.get('type')
        };
        return $.extend({}, defaults, params);
    },

    reset: function () {
        this.set('minDate', null);
        this.set('maxDate', null);
        this.set('sortField', null);
        this.set('sortOrder', null);
        this.set('search', null);
        this.set('type', 'transactions');
    },

    changeDateFilter: function (minDate, maxDate) {
        this.set('minDate', minDate);
        this.set('maxDate', maxDate);
        this.query();
    },

    changeSortOrder: function (field, sortOrder) {
        this.set('sortField', field);
        this.set('sortOrder', sortOrder);
        this.query();
    },

    changeTypeFilter: function (type) {
        this.set('type', type || 'transactions');
    },

    selectSearchResult: function (uri) {
        window.location.hash = '#' + Balanced.Utils.uriToDashboardFragment(uri);
    },

    redirectToLog: function (ohm) {
        window.location = '#/marketplaces/{0}/logs/{1}'.format(
            this.get('controllers').get('marketplace').get('id'),
            ohm
        );
    },

    totalTransactionsHeader: function () {
        if (this.get('content')) {
            return 'Transactions (' + this.get('content').get('total_transactions') + ')';
        } else {
            return 'Transactions (0)';
        }

    }.property('content.total_transactions'),

    totalFundingInstrumentsHeader: function () {
        if (this.get('content')) {
            return 'Cards & Bank Accounts (' + this.get('content').get('total_funding_instruments') + ')';
        } else {
            return 'Cards & Bank Accounts (0)';
        }

    }.property('content.total_funding_instruments')
});
