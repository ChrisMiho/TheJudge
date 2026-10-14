import { useState } from "react";

const CAT_WIZARD_IMAGE_URL = "/assets/cats-homescreen.png";

/**
 * REQ-203: the cat-wizard picture, 224px wide and centred. On a load failure the
 * text "Cat wizard" stands in.
 */
export function CatWizardPicture(): JSX.Element {
  const [failed, setFailed] = useState(false);
  return (
    <div className="p-2 text-center">
      {failed ? (
        <p className="text-2xl font-semibold">Cat wizard</p>
      ) : (
        <img
          src={CAT_WIZARD_IMAGE_URL}
          alt="Cat wizard"
          onError={() => setFailed(true)}
          className="mx-auto w-56 max-w-full rounded-xl"
        />
      )}
    </div>
  );
}
