var currentModeList = ["rgb","depth"];
var currentNumberOfViewsList = ["3","6","9"];
var currentSceneList = ['flower','fortress','fern','leaves','orchids','room','trex','horns'];
var currentSceneProgressive = 'flower';
var currentNumberOfViewsProgressive = 9;

var currentSceneComparison = 'horns';
var currentNumberOfViewsComparison = 3;
var currentModeComparison = 'rgb';


document.addEventListener('DOMContentLoaded', function() {
    var children_number_of_views = [].slice.call(document.getElementById("number-of-views-ul").children);
    children_number_of_views.forEach(function(item) {
        item.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            ChangeNumberOfViews(index);
        });

    });
    var children_number_of_views = [].slice.call(document.getElementById("scene-view-ul").children);
    children_number_of_views.forEach(function(item) {
        item.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            ChangeSceneProgressive(index);
        });
    });

    var children_comparison_mode = [].slice.call(document.getElementById("comparison-model-ul").children);
    children_comparison_mode.forEach(function(item) {
        item.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            ChangeModeComparison(index);
        });
    });
    
    
    var children_comparison_mode = [].slice.call(document.getElementById("comparison-number-of-views-ul").children);
    children_comparison_mode.forEach(function(item) {
        item.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            ChangeNumberOfViewsComparison(index);
        });
    });

    var children_comparison_mode = [].slice.call(document.getElementById("comparison-scene-view-ul").children);
    children_comparison_mode.forEach(function(item) {
        item.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            ChangeSceneComparison(index);
        });
    });
});

//Comparison Functions
function ChangeModeComparison(idx){
    var li_list = document.getElementById("comparison-model-ul").children;
    for(i = 0; i < li_list.length; i++){
        li_list[i].className = "";
    }
    li_list[idx].className = "active";
    
    currentModeComparison = currentModeList[idx];
    document.getElementById("comparison").src = "static/"+currentModeComparison+"_videos/"+ currentSceneComparison + "_" + currentNumberOfViewsComparison +".mp4";
    document.getElementById("comparisonRight").src = "static/"+currentModeComparison+"_videos_vanilla/"+ currentSceneComparison + "_" + currentNumberOfViewsComparison +".mp4";

}

function ChangeNumberOfViewsComparison(idx){
    var li_list = document.getElementById("comparison-number-of-views-ul").children;
    for(i = 0; i < li_list.length; i++){
        li_list[i].className = "";
    }
    li_list[idx].className = "active";
    
    currentNumberOfViewsComparison = currentNumberOfViewsList[idx];
    document.getElementById("comparison").src = "static/"+currentModeComparison+"_videos/"+ currentSceneComparison + "_" + currentNumberOfViewsComparison +".mp4";
    document.getElementById("comparisonRight").src = "static/"+currentModeComparison+"_videos_vanilla/"+ currentSceneComparison + "_" + currentNumberOfViewsComparison +".mp4";

}

function ChangeSceneComparison(idx){
    var li_list = document.getElementById("comparison-scene-view-ul").children;
    for(i = 0; i < li_list.length; i++){
        li_list[i].className = "";
    }
    li_list[idx].className = "active";
    
    currentSceneComparison = currentSceneList[idx];
    document.getElementById("comparison").src = "static/"+currentModeComparison+"_videos/"+ currentSceneComparison + "_" + currentNumberOfViewsComparison +".mp4";
    document.getElementById("comparisonRight").src = "static/"+currentModeComparison+"_videos_vanilla/"+ currentSceneComparison + "_" + currentNumberOfViewsComparison +".mp4";

}


// Progressive Learning Functions
function ChangeNumberOfViews(idx){
    var li_list = document.getElementById("number-of-views-ul").children;
    for(i = 0; i < li_list.length; i++){
        li_list[i].className = "";
    }
    li_list[idx].className = "active";
    currentNumberOfViewsProgressive = currentNumberOfViewsList[idx];
    document.getElementById("progressive_complexity").src = "static/videos/"+ currentSceneProgressive + "_" + currentNumberOfViewsProgressive +"_0.mp4";
}

function ChangeSceneProgressive(idx){
    var li_list = document.getElementById("scene-view-ul").children;
    for(i = 0; i < li_list.length; i++){
        li_list[i].className = "";
    }
    li_list[idx].className = "active";
    
    currentSceneProgressive = currentSceneList[idx];
    document.getElementById("progressive_complexity").src = "static/videos/"+ currentSceneProgressive + "_" + currentNumberOfViewsProgressive +"_0.mp4";

}