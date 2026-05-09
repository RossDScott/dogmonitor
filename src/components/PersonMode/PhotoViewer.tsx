import { photoBlobUrl } from '../../services/azureBlob';

interface Props {
  sasUri: string;
  latestPhoto: string | null;
  photoHistory: string[];
}

export function PhotoViewer({ sasUri, latestPhoto, photoHistory }: Props) {
  if (!latestPhoto) {
    return <div className="photo-empty">No photos yet</div>;
  }

  return (
    <div className="photo-viewer">
      <img
        src={photoBlobUrl(sasUri, latestPhoto)}
        alt="Latest"
        className="photo-main"
      />
      {photoHistory.length > 1 && (
        <div className="photo-strip">
          {[...photoHistory].reverse().slice(1, 10).map((p) => (
            <img
              key={p}
              src={photoBlobUrl(sasUri, p)}
              alt={p}
              className="photo-thumb"
            />
          ))}
        </div>
      )}
    </div>
  );
}
