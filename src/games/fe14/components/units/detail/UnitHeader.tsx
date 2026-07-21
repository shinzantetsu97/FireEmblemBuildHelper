import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { getPortraitUrl, type UnitRuntime } from "../../../data";
import { ClassTreeLabel } from "./ClassTree";
import type { AvatarGender } from "./types";
import { useLocale } from "../../../../../i18n/LocaleContext";
import type { MessageKey } from "../../../../../i18n/messages/en";

const ROUTE_LABEL_KEYS: Record<string, MessageKey> = {
  birthright: "filter.route.birthright",
  conquest: "filter.route.conquest",
  revelation: "filter.route.revelation",
};

export default function UnitHeader({
  unit,
  avatarGender,
  setAvatarGender,
}: {
  unit: UnitRuntime;
  avatarGender: AvatarGender;
  setAvatarGender: (gender: AvatarGender) => void;
}) {
  const { identity } = unit;
  const { resolve, t } = useLocale();
  const hasVariablePortrait = identity.id === "corrin" || identity.id === "kana";
  const name = resolve(identity.names, identity.displayName);
  const genderLabel = (gender: AvatarGender) => t(gender === "female" ? "common.female" : "common.male");
  const routeLabel = (route: string) => (ROUTE_LABEL_KEYS[route] ? t(ROUTE_LABEL_KEYS[route]) : route);
  const nobleBaseLabel = avatarGender === "female" ? t("unit.nohrPrincess") : t("unit.nohrPrince");
  return (
    <header className="unit-header">
      <img
        src={getPortraitUrl(identity, avatarGender)}
        alt={hasVariablePortrait
          ? t("unit.portraitAltGendered", { gender: genderLabel(avatarGender), name })
          : t("unit.portraitAlt", { name })}
      />
      <div className="unit-header-copy">
        <div className="unit-header-meta">
          <span>{identity.generation === "second" ? t("filter.generation.second") : t("filter.generation.first")}</span>
          {identity.availabilityCategory === "dlc_exclusive" ? <span>{t("filter.route.dlc")}</span> : null}
          <ClassTreeLabel
            classId={unit.classAccess?.startingClassId ?? "unknown"}
            labelOverride={hasVariablePortrait ? nobleBaseLabel : undefined}
          />
          {identity.unitTags?.map((tag) => (
            <span key={tag}>{tag === "dragon" ? t("unit.tag.dragon") : t("unit.tag.beast")}</span>
          ))}
        </div>
        <h1>{name}</h1>
        <p>
          <span lang="ja">{identity.names?.ja}</span>
          <span lang="zh-Hans">{identity.names?.zhHans}</span>
          <span>{identity.names?.jaLatn}</span>
        </p>
      </div>
      <dl className="unit-header-facts">
        <div>
          <dt>{t("unit.availableIn")}</dt>
          <dd>
            {identity.availabilityCategory === "dlc_exclusive" ? t("unit.dlcPrefix") : ""}
            {identity.availableRoutes.map(routeLabel).join(", ")}
          </dd>
        </div>
        <div>
          <dt>{t("unit.dragonVein")}</dt>
          <dd>{identity.dragonVein ? t("common.yes") : identity.generation === "second" ? t("unit.parentDependent") : t("common.no")}</dd>
        </div>
        {identity.id === "corrin" ? (
          <div className="unit-header-gender">
            <dt>{t("unit.gender")}</dt>
            <dd>
              <ButtonGroup aria-label={t("unit.corrinGender")}>
                {(["male", "female"] as const).map((gender) => (
                  <Button
                    key={gender}
                    size="sm"
                    variant={avatarGender === gender ? "dark" : "outline-secondary"}
                    aria-pressed={avatarGender === gender}
                    onClick={() => setAvatarGender(gender)}
                  >
                    {genderLabel(gender)}
                  </Button>
                ))}
              </ButtonGroup>
            </dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}
