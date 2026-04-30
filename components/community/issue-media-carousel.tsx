import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

export function IssueMediaCarousel({ mediaUrls }: { mediaUrls: string[] }) {
  if (!mediaUrls || mediaUrls.length === 0) return null

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {mediaUrls.map((url, i) => {
          const isVideo = url.match(/\.(mp4|webm|ogg)$/i)
          return (
            <CarouselItem key={i}>
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                {isVideo ? (
                  <video src={url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                )}
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      {mediaUrls.length > 1 && (
        <>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </>
      )}
    </Carousel>
  )
}
