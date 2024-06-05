import { useState } from 'react';

class FilterFormatType {
  name: string = '';
  
  code: string = '';

  constructor ({ name, code }: { name: string; code: string }) {
    this.name = name;
    this.code = code;
  }

  getKey = (): string => this.code.replace(' ', '_').toUpperCase();
}

const FilterFormats: FilterFormatType[] = [
  new FilterFormatType({
    name: 'Archive material - Downloadable',
    code: 'archv - digital',
  }),
  new FilterFormatType({
    name: 'Archival Material',
    code: 'archv -',
  }),
  new FilterFormatType({
    name: 'Article',
    code: 'artchap - artcl',
  }),
  new FilterFormatType({
    name: 'Chapter',
    code: 'artchap - chptr',
  }),
  new FilterFormatType({
    name: 'Article - Downloadable',
    code: 'artchap - digital',
  }),
  new FilterFormatType({
    name: 'Manuscript article',
    code: 'artchap - mss',
  }),
  new FilterFormatType({
    name: 'Audiobook - CD',
    code: 'audiobook - cd',
  }),
  new FilterFormatType({
    name: 'Audiobook - Cassette',
    code: 'audiobook - cassette',
  }),
  new FilterFormatType({
    name: 'Audiobook - Digital',
    code: 'audiobook - digital',
  }),
  new FilterFormatType({
    name: 'Audiobook - LP',
    code: 'audiobook - lp',
  }),
  new FilterFormatType({
    name: 'Audiobook',
    code: 'audiobook -',
  }),
  new FilterFormatType({
    name: 'Book - print',
    code: 'book - printbook',
  }),
  new FilterFormatType({
    name: 'Book - eBook',
    code: 'book - digital',
  }),
  new FilterFormatType({
    name: 'Book - Microform',
    code: 'book - mic',
  }),
  new FilterFormatType({
    name: 'Book - Thesis/Dissertation',
    code: 'book - thsis',
  }),
  new FilterFormatType({
    name: 'Book - Manuscript',
    code: 'book - mss',
  }),
  new FilterFormatType({
    name: 'Book - Large print',
    code: 'book - largeprint',
  }),
  new FilterFormatType({
    name: 'Book - Braille',
    code: 'book - braille',
  }),
  new FilterFormatType({
    name: 'Book - Continually Updated Resource',
    code: 'book - continuing',
  }),
  new FilterFormatType({
    name: 'Book',
    code: 'book -',
  }),
  new FilterFormatType({
    name: 'Computer File - Digital',
    code: 'compfile - digital',
  }),
  new FilterFormatType({
    name: 'Computer File',
    code: 'compfile -',
  }),
  new FilterFormatType({
    name: 'Encyclopedia',
    code: 'encyc -',
  }),
  new FilterFormatType({
    name: 'Game',
    code: 'game -',
  }),
  new FilterFormatType({
    name: 'Image',
    code: 'image - 2d',
  }),
  new FilterFormatType({
    name: 'Interactive Multimedia',
    code: 'intmm -',
  }),
  new FilterFormatType({
    name: 'Journal/Magazine - Print',
    code: 'jrnl - print',
  }),
  new FilterFormatType({
    name: 'Journal/Magazine - Electronic',
    code: 'jrnl - digital',
  }),
  new FilterFormatType({
    name: 'Kit',
    code: 'kit -',
  }),
  new FilterFormatType({
    name: 'Map',
    code: 'map -',
  }),
  new FilterFormatType({
    name: 'Map - Manuscript',
    code: 'map - mss',
  }),
  new FilterFormatType({
    name: 'Map - Digital',
    code: 'map - digital',
  }),
  new FilterFormatType({
    name: 'Musical score - Digital',
    code: 'msscr - digital',
  }),
  new FilterFormatType({
    name: 'Musical score - Manuscript',
    code: 'msscr - mss',
  }),
  new FilterFormatType({
    name: 'Musical score',
    code: 'msscr -',
  }),
  new FilterFormatType({
    name: 'Music - CD',
    code: 'music - cd',
  }),
  new FilterFormatType({
    name: 'Music - LP',
    code: 'music - lp',
  }),
  new FilterFormatType({
    name: 'Music - Digital',
    code: 'music - digital',
  }),
  new FilterFormatType({
    name: 'Music - Cassette',
    code: 'music - cassette',
  }),
  new FilterFormatType({
    name: 'Music',
    code: 'music -',
  }),
  new FilterFormatType({
    name: 'Newspaper - Digital',
    code: 'news - digital',
  }),
  new FilterFormatType({
    name: 'Newspaper - Print',
    code: 'news - print',
  }),
  new FilterFormatType({
    name: 'Object - Digital',
    code: 'object - digital',
  }),
  new FilterFormatType({
    name: 'Object',
    code: 'object -',
  }),
  new FilterFormatType({
    name: 'Sound recording',
    code: 'snd -',
  }),
  new FilterFormatType({
    name: 'Toy',
    code: 'toy -',
  }),
  new FilterFormatType({
    name: 'Video - DVD',
    code: 'video - dvd',
  }),
  new FilterFormatType({
    name: 'Video - VHS',
    code: 'video - vhs',
  }),
  new FilterFormatType({
    name: 'Video - Digital',
    code: 'video - digital',
  }),
  new FilterFormatType({
    name: 'Video - Film',
    code: 'video - film'
  }),
  new FilterFormatType({
    name: 'Video - Bluray',
    code: 'video - bluray',
  }),
  new FilterFormatType({
    name: 'Video',
    code: 'video -',
  }),
  new FilterFormatType({
    name: 'Visual material - Digital',
    code: 'vis - digital',
  }),
  new FilterFormatType({
    name: 'Visual material',
    code: 'vis -',
  }),
  new FilterFormatType({
    name: 'Web - Digital',
    code: 'web - digital',
  }),
  new FilterFormatType({
    name: 'Web - DWN2D',
    code: 'web - dwn2d',
  }),
  new FilterFormatType({
    name: 'Web',
    code: 'web -',
  })
];

export default function FormatAutoComplete() {
  const [filteredSuggestions, setFilteredSuggestions] = useState<Array<FilterFormatType>>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputText, setInputText] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    // Filter out suggestions that don't contain the user's input
    const unLinked: Array<FilterFormatType> = FilterFormats.filter(
        (suggestion) => suggestion.name.toLowerCase().includes(userInput.toLowerCase())
    );

    setInputText(e.target.value);
    setFilteredSuggestions(unLinked);
    setActiveSuggestionIndex(0);
    setShowSuggestions(true);
  };
  
  const onClick = (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    if (e.target instanceof HTMLElement) {
      setFilteredSuggestions([]);
      setInputText(e.target.innerText);
      setActiveSuggestionIndex(0);
      setShowSuggestions(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.target instanceof HTMLElement) {
      if (e.key === "ArrowDown") {
        if (activeSuggestionIndex === filteredSuggestions.length - 1) {
          setActiveSuggestionIndex(filteredSuggestions.length - 1);
        } else {
          setActiveSuggestionIndex(activeSuggestionIndex + 1);
        }
      } else if (e.key === "ArrowUp") {
        if (activeSuggestionIndex === 0) {
          setActiveSuggestionIndex(0);
        } else {
          setActiveSuggestionIndex(activeSuggestionIndex - 1);
        }
      } else if (e.key === "Enter") {
        setFilteredSuggestions([]);
        setInputText(filteredSuggestions[activeSuggestionIndex].name);
        setActiveSuggestionIndex(0);
        setShowSuggestions(false);
      } else if (e.key === "Escape") {
        setFilteredSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };
  
  const FormatList = () => {
    return filteredSuggestions.length ? (
      <ul className="suggestions">
        {filteredSuggestions.map((suggestion, index) => {
          const class_name = index === activeSuggestionIndex ? "suggestion-active" : "";
          return (
            <li className={class_name} key={suggestion.getKey()} onClick={onClick}>
              {suggestion.name}
            </li>
          );
        })}
      </ul>
    ) : (
      <div className="no-suggestions">
        <em>No matching item type!</em>
      </div>
    );
  };

  return (
    <>
      <input
        type="text"
        id="filterFormat"
        onChange={onChange}
        onKeyDown={onKeyDown}
        value={inputText}
      />
      {showSuggestions && inputText && <FormatList />}
    </>
  )
}
