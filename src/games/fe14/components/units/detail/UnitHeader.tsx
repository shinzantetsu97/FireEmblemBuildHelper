import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { displayId, getPortraitUrl, type UnitRuntime } from "../../../data";
import { ClassTreeLabel } from "./ClassTree";
import type { AvatarGender } from "./types";

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
  return (
    <header className="unit-header">
      <img
        src={getPortraitUrl(identity, avatarGender)}
        alt={identity.id === "corrin" ? `${displayId(avatarGender)} Corrin portrait` : `${identity.displayName} portrait`}
      />
      <div className="unit-header-copy">
        <div className="unit-header-meta">
          <span>First generation</span>
          {identity.availabilityCategory === "dlc_exclusive" ? <span>DLC-exclusive</span> : null}
          <ClassTreeLabel
            classId={unit.classAccess?.startingClassId ?? "unknown"}
            labelOverride={identity.id === "corrin" ? corrinNobleBaseLabel(avatarGender) : undefined}
          />
          {identity.unitTags?.map((tag) => <span key={tag}>{displayId(tag)} unit</span>)}
        </div>
        <h1>{identity.displayName}</h1>
        <p>
          <span lang="ja">{identity.names?.ja}</span>
          <span lang="zh-Hans">{identity.names?.zhHans}</span>
          <span>{identity.names?.jaLatn}</span>
        </p>
      </div>
      <dl className="unit-header-facts">
        <div>
          <dt>Available In</dt>
          <dd>
            {identity.availabilityCategory === "dlc_exclusive" ? "DLC: " : ""}
            {identity.availableRoutes.map(displayId).join(", ")}
          </dd>
        </div>
        <div><dt>Dragon Vein</dt><dd>{identity.dragonVein ? "Yes" : "No"}</dd></div>
        {identity.id === "corrin" ? (
          <div className="unit-header-gender">
            <dt>Gender</dt>
            <dd>
              <ButtonGroup aria-label="Corrin gender">
                {(["male", "female"] as const).map((gender) => (
                  <Button
                    key={gender}
                    size="sm"
                    variant={avatarGender === gender ? "dark" : "outline-secondary"}
                    aria-pressed={avatarGender === gender}
                    onClick={() => setAvatarGender(gender)}
                  >
                    {displayId(gender)}
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

export function corrinNobleBaseLabel(gender: AvatarGender): string {
  return gender === "female" ? "Nohr Princess" : "Nohr Prince";
}
