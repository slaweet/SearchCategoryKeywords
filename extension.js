/**
 * SearchCategoryKeywords extension
 * v0.1
 *
 */
const Lang = imports.lang;
const St = imports.gi.St;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Search = imports.ui.search;
const SearchDisplay = imports.ui.searchDisplay;

function SearchByProviderSystem() {
    this._init();
}

SearchByProviderSystem.prototype = {
    __proto__: Search.SearchSystem.prototype,

    updateSearchResults: function(terms) {
        if (!terms)
            return;

        if(terms.length <= 1){
			Search.SearchSystem.prototype.updateSearchResults.call(this, terms);
			return;
        }

        let activeCategory = [];
        let categorySearchActive = false;
        let keyWord = terms[0]
        for (let i = 0; i < this._providers.length; i++) {
            activeCategory.push(keyWord.toUpperCase() == this._providers[i].title.substring(0, keyWord.length))
            categorySearchActive |= activeCategory[i];
        }

        if(!categorySearchActive){
			Search.SearchSystem.prototype.updateSearchResults.call(this, terms);
			return;
        }

        let isSubSearch = terms.length == this._previousTerms.length;
        if (isSubSearch) {
            for (let i = 0; i < terms.length; i++) {
                if (terms[i].indexOf(this._previousTerms[i]) != 0) {
                    isSubSearch = false;
                    break;
                }
            }
        }

        terms.splice(0,1);
        let results = [];
        if (isSubSearch) {
            for (let i = 0; i < this._previousResults.length; i++) {
                let [provider, previousResults] = this._previousResults[i];
                provider.tryCancelAsync();
                try {
                    let providerResults = (activeCategory[i] 
                        ? provider.getSubsearchResultSet(previousResults, terms)
                        : previousResults);
                    results.push([provider, providerResults]);
                } catch (error) {
                    global.log ('A ' + error.name + ' has occured in ' + provider.title + ': ' + error.message);
                }
            }
        } else {
            for (let i = 0; i < this._providers.length; i++) {
                let provider = this._providers[i];
                provider.tryCancelAsync();
                try {
                    let providerResults = provider.getInitialResultSet(activeCategory[i] ? terms : []);
                    results.push([provider, providerResults]);
                } catch (error) {
                    global.log ('A ' + error.name + ' has occured in ' + provider.title + ': ' + error.message);
                }
            }
        }
        terms.splice(0, 0, keyWord)
        this._previousTerms = terms;
        this._previousResults = results;
        this.emit('search-completed', results);
    },

}

function SearchCategoryKeywordsExtension() {
    this._init();
}

SearchCategoryKeywordsExtension.prototype = {
    _init: function() {
        let searchTab = Main.overview._viewSelector._searchTab;
        this._providers = searchTab._searchSystem._providers;
    },

    _update: function(searchSystem) {
        let searchTab = Main.overview._viewSelector._searchTab;
        searchTab._searchSystem = searchSystem;
        searchTab._searchResults = new SearchDisplay.SearchResults(searchTab._searchSystem, searchTab._openSearchSystem);
        searchTab.page.set_child(searchTab._searchResults.actor);

        for (let i = 0; i < this._providers.length; i++) {
            searchTab.addSearchProvider(this._providers[i]);
        }
    },
    disable: function() {
        this._update(new Search.SearchSystem());
    },
    enable: function() {
        this._update(new SearchByProviderSystem());
    }	   
}

function init() {
    return new SearchCategoryKeywordsExtension();
}
