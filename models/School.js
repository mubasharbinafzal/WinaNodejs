const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema({
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
  createdBy: {
    type: String,
    required: false,
  },
  datasetid: {
    type: String,
    required: false,
  },
  recordid: {
    type: String,
    required: false,
  },
  fields: {
    localite_acheminement_uai: {
      type: String,
      required: false,
    },
    reg_id_old: {
      type: String,
      required: false,
    },

    identifiant_interne: {
      type: String,
      required: false,
    },
    aca_nom: {
      type: String,
      required: false,
    },
    identifiant_eter: {
      type: String,
      required: false,
    },
    secteur_d_etablissement: {
      type: String,
      enum: ["Public", "Private"],
      required: false,
    },
    com_nom: {
      type: String,
      required: false,
    },
    uai: {
      type: String,
      required: false,
    },
    uo_lib: {
      type: String,
      required: false,
    },
    element_wikidata: {
      type: String,
      required: false,
    },
    identifiant_wikidata: {
      type: String,
      required: false,
    },

    code_postal_uai: {
      type: String,
      required: false,
    },
    com_code: {
      type: Number,
      required: false,
    },
    siren: {
      type: String,
      required: false,
    },
    siret: {
      type: String,
      required: false,
    },
    sigle: {
      type: String,
      required: false,
    },
    reg_nom_old: {
      type: String,
      required: false,
    },
    boite_postale_uai: {
      type: String,
      required: false,
    },
    uucr_id: {
      type: String,
      required: false,
    },
    dep_nom: {
      type: String,
      required: false,
    },
    aca_id: {
      type: String,
      required: false,
    },
    adresse_uai: {
      type: String,
      required: false,
    },
    localisation: {
      type: String,
      required: false,
    },
    type_d_etablissement: {
      type: String,
      required: false,
    },
    article: {
      type: String,
      required: false,
    },
    uucr_nom: {
      type: String,
      required: false,
    },
    coordonnees: [
      {
        type: String,
        required: false,
      },
    ],
    vague_contractuelle: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    pays_etranger_acheminement: {
      type: String,
      required: false,
      default: "France",
    },
    uo_lib_en: {
      type: String,
      required: false,
    },
    reg_nom: {
      type: String,
      required: false,
    },
    reg_id: {
      type: String,
      required: false,
    },
    mention_distribution: {
      type: String,
      required: false,
    },
    implantations: {
      type: String,
      required: false,
    },
    dep_id: {
      type: String,
      required: false,
    },
  },
  geometry: {
    type: {
      type: String,
      required: false,
    },
    coordinates: {
      type: Array,
      required: false,
    },
  },
  record_timestamp: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("School", SchoolSchema);
