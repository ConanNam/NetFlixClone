import { combineReducers } from "redux";
import authenReducer from "./authenReducer";
import moviesReducer from "./moviesReducer";
import searchReducer from "./searchReducer";
import accountReducer from "./accountReducer";
const allReducers = combineReducers({
    /** 01 */    authenReducer,
    /** 02 */    moviesReducer,
    /** 03 */   searchReducer,
    /** 04 */   accountReducer,

});
export default allReducers;