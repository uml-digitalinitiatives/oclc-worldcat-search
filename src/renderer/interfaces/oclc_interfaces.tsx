export class DiscoveryQuery {
  searchType = '';

  searchNumber: string | number = '';

  holdingsAllEditions = false;

  holdingsAllVariantRecords = false;

  preferredLanguage = 'en';

  holdingsFilterFormat: Array<string> = [];

  heldInCountry = '';

  heldInState = '';

  heldByGroup = '';

  heldBySymbol: Array<string> = [];

  heldByInstitutionId: Array<string> = [];

  heldByLibraryType: Array<string> = [];

  lat: number | null = null;

  lon: number | null = null;

  distance: number | null = null;

  unit = '';

  constructor({ searchType, searchNumber }: { searchType: string, searchNumber: string }) {
    if (!['oclc', 'isbn', 'issn'].includes(searchType.trim().toLowerCase())) {
      throw new Error('Invalid search type, must be one of OCLC, ISBN, or ISSN');
    }
    this.searchType = searchType.trim().toLowerCase();
    this.searchNumber = searchNumber;
  }

  setHoldingsAllEditions = (value: boolean): this => {
    this.holdingsAllEditions = value;
    return this;
  };

  setHoldingsAllVariantRecords = (value: boolean): this => {
    this.holdingsAllVariantRecords = value;
    return this;
  };

  setPreferredLanguage = (value: string): this => {
    this.preferredLanguage = value;
    return this;
  };

  setHoldingsFilterFormat = (value: Array<string>): this => {
    this.holdingsFilterFormat = value;
    return this;
  };

  addHoldingsFilterFormat = (value: string): this => {
    if (!this.holdingsFilterFormat.includes(value)) {
      this.holdingsFilterFormat.push(value);
    }
    return this;
  };

  removeHoldingFilterFormat = (value: string): this => {
    this.holdingsFilterFormat = this.holdingsFilterFormat.filter(
      (format) => format.trim().toLowerCase() !== value.trim().toLowerCase(),
    );
    return this;
  };

  clearHoldingsFilterFormat = (): this => {
    this.holdingsFilterFormat = [];
    return this;
  };

  setHeldInCountry = (value: string): this => {
    this.heldInCountry = value;
    return this;
  };

  setHeldInState = (value: string): this => {
    this.heldInState = value;
    return this;
  };

  setHeldByGroup = (value: string): this => {
    this.heldByGroup = value;
    return this;
  };

  setHeldBySymbol = (value: Array<string>): this => {
    this.heldBySymbol = value;
    return this;
  };

  addHeldBySymbol = (value: string): this => {
    if (!this.heldBySymbol.includes(value)) {
      this.heldBySymbol.push(value);
    }
    return this;
  };

  removeHeldBySymbol = (value: string): this => {
    this.heldBySymbol = this.heldBySymbol.filter(
      (symbol) => symbol.trim().toLowerCase() !== value.trim().toLowerCase(),
    );
    return this;
  };

  clearHeldBySymbol = (): this => {
    this.heldBySymbol = [];
    return this;
  };

  setHeldByInstitutionId = (value: Array<string>): this => {
    this.heldByInstitutionId = value;
    return this;
  };

  addHeldByInstitutionId = (value: string): this => {
    if (!this.heldByInstitutionId.includes(value)) {
      this.heldByInstitutionId.push(value);
    }
    return this;
  };

  removeHeldByInstitutionId = (value: string): this => {
    this.heldByInstitutionId = this.heldByInstitutionId.filter(
      (id) => id.trim().toLowerCase() !== value.trim().toLowerCase(),
    );
    return this;
  };

  clearHeldByInstitutionId = (): this => {
    this.heldByInstitutionId = [];
    return this;
  };

  setHeldByLibraryType = (value: Array<string>): this => {
    this.heldByLibraryType = value;
    return this;
  };

  addHeldByLibraryType = (value: string): this => {
    if (!this.heldByLibraryType.includes(value)) {
      this.heldByLibraryType.push(value);
    }
    return this;
  };

  removeHeldByLibraryType = (value: string): this => {
    this.heldByLibraryType = this.heldByLibraryType.filter(
      (type) => type.trim().toLowerCase() !== value.trim().toLowerCase(),
    );
    return this;
  };

  clearHeldByLibraryType = (): this => {
    this.heldByLibraryType = [];
    return this;
  };

  setCoords = (lat: number, lon: number): this => {
    this.lat = lat;
    this.lon = lon;
    return this;
  };

  clearCoords = (): this => {
    this.lat = null;
    this.lon = null;
    return this;
  };

  setDistance = (value: number, unit: string): this => {
    if (unit.trim().toLowerCase() !== 'm' && unit.trim().toLowerCase() !== 'k') {
      throw new Error('Invalid unit, must be either "m" (miles) or "k" (kilometers)');
    }
    this.distance = value;
    return this;
  };

  clearDistance = (): this => {
    this.distance = null;
    this.unit = '';
    return this;
  };

  static fromJSON = (json: string): DiscoveryQuery => {
    const obj = JSON.parse(json);
    let q: DiscoveryQuery;
    if (obj.searchType === 'oclc') {
      q = new DiscoveryQuery({ searchType: obj.searchType, searchNumber: obj.oclcNumber });
    } else if (obj.searchType === 'isbn') {
      q = new DiscoveryQuery({ searchType: obj.searchType, searchNumber: obj.isbn });
    } else if (obj.searchType === 'issn') {
      q = new DiscoveryQuery({ searchType: obj.searchType, searchNumber: obj.issn });
    } else {
      throw new Error('Invalid search type');
    }
    q.holdingsAllEditions = obj.holdingsAllEditions;
    q.holdingsAllVariantRecords = obj.holdingsAllVariantRecords;
    q.preferredLanguage = obj.preferredLanguage;
    q.holdingsFilterFormat = obj.holdingsFilterFormat;
    q.heldInCountry = obj.heldInCountry;
    q.heldInState = obj.heldInState;
    q.heldByGroup = obj.heldByGroup;
    q.heldBySymbol = obj.heldBySymbol;
    q.heldByInstitutionId = obj.heldByInstitutionId;
    q.heldByLibraryType = obj.heldByLibraryType;
    q.lat = obj.lat;
    q.lon = obj.lon;
    q.distance = obj.distance;
    q.unit = obj.unit;
    return q;
  };

  toJSON = (): string => {
    const json: { [key: string]: string | number | boolean | string[] } = {
      searchType: this.searchType,
      holdingsAllEditions: this.holdingsAllEditions,
      holdingsAllVariantRecords: this.holdingsAllVariantRecords,
      preferredLanguage: this.preferredLanguage,
      holdingsFilterFormat: this.holdingsFilterFormat,
      heldInCountry: this.heldInCountry,
      heldInState: this.heldInState,
      heldByGroup: this.heldByGroup,
      heldBySymbol: this.heldBySymbol,
      heldByInstitutionId: this.heldByInstitutionId,
      heldByLibraryType: this.heldByLibraryType,
    };
    if (this.searchType === 'oclc') {
      json.oclcNumber = this.searchNumber;
    } else if (this.searchType === 'isbn') {
      json.isbn = this.searchNumber;
    } else if (this.searchType === 'issn') {
      json.issn = this.searchNumber;
    }
    if (this.lat !== null && this.lon !== null) {
      json.lat = this.lat;
      json.lon = this.lon;
    }
    if (this.distance !== null) {
      json.distance = this.distance;
      json.unit = this.unit;
    }
    return JSON.stringify(json);
  };

  toSearchString = (): JSON => {
    const json = JSON.parse(this.toJSON());
    delete json.searchType;
    const jKeys = Object.keys(json);
    for (let keyIdx = 0; keyIdx < jKeys.length; keyIdx += 1) {
      const key = jKeys[keyIdx];
      if (
        json[key] === null
        || json[key] === ''
        || (
          typeof json[key] === 'object'
          && json[key].length === 0
        )
        || json[key] === false
      ) {
        // Delete empty or null values
        delete json[key];
      } else if (typeof json[key] === 'object' && json[key].length > 0) {
        // Join arrays into comma-separated strings
        json[key] = json[key].join(',');
      }
    }
    return json;
  };
}

export const briefRecordJsonHeaders = [
  'MMS ID',
  'OCLC Number',
  'Title',
  'Creator',
  'Date',
  'Language',
  'General Format',
  'Specific Format',
  'Edition',
  'Publisher',
  'Publication Place',
  'Merged Oclc Numbers',
  'ISBNs',
  'ISSNs',
  'Institution Name',
  'OCLC Symbol',
  'Registry Id',
  'Country',
  'State',
  'ILL Status',
  'Institution Type',
];

export const formatBriefRecordToJson = (
  record: BriefRecordInterface,
  filterLocal = false,
): string[][] => {
  const holdings = [];
  const baseRecord = [
    record.mmsId,
    record.oclcNumber,
    record.title,
    record.creator,
    record.date,
    record.language,
    record.generalFormat,
    record.specificFormat,
    record.edition,
    record.publisher,
    record.publicationPlace,
    (
      record.mergedOclcNumbers !== undefined
      && record.mergedOclcNumbers.length > 0 ? record.mergedOclcNumbers.join(', ') : ''
    ),
    (record.isbns !== undefined && record.isbns.length > 0 ? record.isbns.join(', ') : ''),
    (record.issns !== undefined && record.issns.length > 0 ? record.issns.join(', ') : ''),
  ];
  if (
    record.institutionHolding === undefined
    || record.institutionHolding.briefHoldings === undefined
    || record.institutionHolding.briefHoldings.length === 0
  ) {
    holdings.push(baseRecord.concat([
      'No holdings found',
    ]));
  } else {
    for (let holdIdx = 0; holdIdx < record.institutionHolding.briefHoldings.length; holdIdx += 1) {
      const holding = record.institutionHolding.briefHoldings[holdIdx];
      if (!filterLocal || (filterLocal && holding.oclcSymbol !== 'UAT')) {
        holdings.push(baseRecord.concat([
          holding.institutionName,
          holding.oclcSymbol,
          `${holding.registryId}`,
          holding.country,
          holding.state,
          holding.illStatus,
          holding.institutionType,
        ]));
      }
    }
  }
  return holdings;
};

export interface BriefRecordInterface {
  [key: string]: string | Array<string> | CataloguingInfoInterface | GeneralHoldingsInterface
  mmsId: string
  oclcNumber: string
  title: string
  creator: string
  date: string
  language: string
  generalFormat: string
  specificFormat: string
  edition: string
  publisher: string
  publicationPlace: string
  mergedOclcNumbers: Array<string>
  isbns: Array<string>
  issns: Array<string>
  catalogingInfo: CataloguingInfoInterface
  institutionHolding: GeneralHoldingsInterface
}

export interface GeneralHoldingsInterface {
  totalHoldingCount: number
  totalSharedPrintCount: number
  totalEditions: number
  briefHoldings: Array<HoldingsInterface>
}

export interface CataloguingInfoInterface {
  catalogingAgency: string
  transcribingAgency: string
  catalogingLanguage: string
  levelOfCataloging: string
}

export interface HoldingsInterface {
  [key: string]: string | number | AddressInterface
  country: string
  state: string
  oclcSymbol: string
  registryId: number
  institutionName: string
  self: string
  illStatus: string
  address: AddressInterface
  institutionType: string
}

export interface AddressInterface {
  street1: string
  city: string
  state: string
  postalCode: string
  country: string
  lat: string
  lon: string
}
