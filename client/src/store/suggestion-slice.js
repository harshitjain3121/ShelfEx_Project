import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  refreshCelebritySuggestionsCount: 0
}

const suggestionSlice = createSlice({
  name: 'suggestion',
  initialState,
  reducers: {
    refreshCelebritySuggestions: state => {
      state.refreshCelebritySuggestionsCount++
    }
  }
})

export const suggestionActions = suggestionSlice.actions
export default suggestionSlice 