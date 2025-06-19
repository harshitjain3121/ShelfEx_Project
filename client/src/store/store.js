import { configureStore } from "@reduxjs/toolkit";

import uiSlice from "./ui-slice";
import userSlice from "./user-slice";
import suggestionSlice from './suggestion-slice'

const store = configureStore({
    reducer: {
        ui: uiSlice.reducer,
        user: userSlice.reducer,
        suggestion: suggestionSlice.reducer
    }
})

export default store;