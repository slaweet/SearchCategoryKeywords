/**
 * SearchCategoryKeywords extension
 * v0.1.1
 *
 */

const Main = imports.ui.main;

function SearchCategoryKeywordsExtension() {
    this._init();
}

SearchCategoryKeywordsExtension.prototype = {

    _init: function() {
        this.searchSystem = Main.overview._viewSelector._searchTab._searchSystem;
    },

    updateSearchResults: function(terms) {
        if (!terms)
            return;

        if(terms.length <= 1){
			this.originalUpdateSearchResults(terms);
			return;
        }

        let activeCategory = [];
        let categorySearchActive = false;
        let keyWord = terms[0]
        for (let i = 0; i < this._providers.length; i++) {
            activeCategory.push(this._providers[i].title.indexOf(keyWord.toUpperCase()) == 0)
            categorySearchActive |= activeCategory[i];
        }

        if(!categorySearchActive){
			this.originalUpdateSearchResults(terms);
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

    disable: function() {
        if(this.searchSystem.originalUpdateSearchResults) {
            this.searchSystem.updateSearchResults = this.searchSystem.originalUpdateSearchResults;
            this.searchSystem.originalUpdateSearchResults = undefined;
        }
    },
    enable: function() {
        if(!this.searchSystem.originalUpdateSearchResults)
            this.searchSystem.originalUpdateSearchResults = this.searchSystem.updateSearchResults;
        this.searchSystem.updateSearchResults = this.updateSearchResults;
    }	   
}

function init() {
    return new SearchCategoryKeywordsExtension();
}
